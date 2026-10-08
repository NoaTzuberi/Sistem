import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Types } from 'mongoose';
import type { DietTag, FoodGroup, PortionCounts } from '@sistem/types';
import { Template } from '../templates/template.model';
import { FoodItem } from './foodItem.model';
import { DIET_TAG_IDS, FOOD_GROUP_IDS } from './nutrition.constants';
import { isPortionCount } from './nutrition.validation';
import type { MealFields } from './nutrition.types';

// seed:nutrition (Phase 13a) — the coach's guide as her starting food list and one
// template. The data file is her own content, so it lives in apps/server/data/nutrition/
// (gitignored) and is never committed; this code only knows its shape. Idempotent per
// coach: every item / the template has a seedKey, and anything already seeded is left as
// it is (the coach may have edited it since).

/** apps/server/data/nutrition/guide-1500.json — gitignored. */
export const DEFAULT_NUTRITION_SEED_FILE = path.resolve(__dirname, '../../../data/nutrition/guide-1500.json');

export interface SeedFood {
  key: string;
  group: FoodGroup;
  name: string;
  portion: string;
  grams: number | null;
  isNew: boolean;
  dietTags: DietTag[];
}

export type SeedLine = { food: string; portions: number } | { text: string; group?: FoodGroup | null; portions?: number };

export interface NutritionSeedData {
  seedKeyPrefix: string;
  foods: SeedFood[];
  template: {
    key: string;
    name: string;
    description?: string;
    targetKcal: number | null;
    tips: string[];
    meals: {
      name: string;
      portions: PortionCounts;
      vegetablesFree: boolean;
      options: { label: string; lines: SeedLine[] }[];
    }[];
  };
}

export interface NutritionSeedResult {
  foodsCreated: number;
  foodsKept: number;
  templateCreated: boolean;
}

/** Checks the file before anything is written: a bad reference must never half-seed. */
export function validateNutritionSeed(data: NutritionSeedData): string[] {
  const problems: string[] = [];
  const keys = new Set<string>();
  for (const food of data.foods ?? []) {
    if (keys.has(food.key)) problems.push(`Duplicate food key ${food.key}.`);
    keys.add(food.key);
    if (!(FOOD_GROUP_IDS as readonly string[]).includes(food.group)) problems.push(`${food.key}: unknown group ${food.group}.`);
    if (!food.name?.trim() || !food.portion?.trim()) problems.push(`${food.key}: name and portion are required.`);
    for (const tag of food.dietTags ?? []) {
      if (!(DIET_TAG_IDS as readonly string[]).includes(tag)) problems.push(`${food.key}: unknown diet tag ${tag}.`);
    }
  }
  const template = data.template;
  if (!template?.name?.trim() || !Array.isArray(template.meals) || template.meals.length === 0) {
    problems.push('The template needs a name and at least one meal.');
    return problems;
  }
  template.meals.forEach((meal, mealIndex) => {
    for (const group of ['protein', 'carb', 'fat'] as const) {
      if (!isPortionCount(meal.portions?.[group] ?? 0, 10)) problems.push(`Meal ${mealIndex + 1}: bad ${group} portions.`);
    }
    for (const option of meal.options) {
      for (const line of option.lines) {
        if ('food' in line) {
          if (!keys.has(line.food)) problems.push(`Meal ${mealIndex + 1} (${option.label}): unknown food ${line.food}.`);
          if (!isPortionCount(line.portions, 10) || line.portions === 0) problems.push(`Meal ${mealIndex + 1}: bad portions for ${line.food}.`);
        } else if (!line.text?.trim()) {
          problems.push(`Meal ${mealIndex + 1} (${option.label}): a text line has no text.`);
        }
      }
    }
  });
  return problems;
}

export async function readNutritionSeedFile(path: string): Promise<NutritionSeedData> {
  return JSON.parse(await readFile(path, 'utf8')) as NutritionSeedData;
}

export async function applyNutritionSeed(coachId: string, data: NutritionSeedData): Promise<NutritionSeedResult> {
  const problems = validateNutritionSeed(data);
  if (problems.length > 0) throw new Error(`The nutrition seed file is not valid:\n- ${problems.join('\n- ')}`);

  const seedKey = (key: string) => `${data.seedKeyPrefix}:${key}`;
  let foodsCreated = 0;
  const groupOrder = new Map<FoodGroup, number>();
  for (const food of data.foods) {
    const order = groupOrder.get(food.group) ?? 0;
    groupOrder.set(food.group, order + 1);
    const result = await FoodItem.updateOne(
      { coachId, seedKey: seedKey(food.key) },
      {
        $setOnInsert: {
          coachId,
          seedKey: seedKey(food.key),
          group: food.group,
          name: food.name.trim(),
          portion: food.portion.trim(),
          grams: food.grams ?? null,
          kcal: null,
          isNewItem: food.isNew === true,
          dietTags: food.dietTags ?? [],
          order,
          archivedAt: null,
        },
      },
      { upsert: true },
    );
    foodsCreated += result.upsertedCount;
  }

  const templateKey = seedKey(data.template.key);
  if (await Template.exists({ coachId, seedKey: templateKey })) {
    return { foodsCreated, foodsKept: data.foods.length - foodsCreated, templateCreated: false };
  }

  const items = await FoodItem.find({ coachId, seedKey: { $in: data.foods.map((food) => seedKey(food.key)) } })
    .select('seedKey group')
    .lean();
  const byKey = new Map(items.map((item) => [item.seedKey!, item]));
  const meals: MealFields[] = data.template.meals.map((meal) => ({
    _id: new Types.ObjectId(),
    name: meal.name.trim(),
    portions: { protein: meal.portions.protein ?? 0, carb: meal.portions.carb ?? 0, fat: meal.portions.fat ?? 0 },
    vegetablesFree: meal.vegetablesFree === true,
    options: meal.options.map((option) => ({
      _id: new Types.ObjectId(),
      label: option.label.trim(),
      lines: option.lines.map((line) => {
        if ('food' in line) {
          const item = byKey.get(seedKey(line.food))!;
          return { _id: new Types.ObjectId(), kind: 'food' as const, foodItemId: item._id, group: item.group, portions: line.portions };
        }
        const group = line.group ?? null;
        const counted = group !== null && group !== 'vegetable';
        return { _id: new Types.ObjectId(), kind: 'text' as const, text: line.text.trim(), group, portions: counted ? (line.portions ?? null) : null };
      }),
    })),
  }));

  await Template.create({
    coachId,
    type: 'nutrition_plan',
    seedKey: templateKey,
    name: data.template.name.trim(),
    description: data.template.description?.trim(),
    nutrition: {
      targetKcal: data.template.targetKcal ?? null,
      meals,
      tips: data.template.tips.map((text) => ({ _id: new Types.ObjectId(), text: text.trim() })),
    },
  });
  return { foodsCreated, foodsKept: data.foods.length - foodsCreated, templateCreated: true };
}
