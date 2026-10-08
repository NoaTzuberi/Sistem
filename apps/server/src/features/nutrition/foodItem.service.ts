import type { DeleteFoodItemResult, FoodItem, FoodItemPayload, PortionGroup } from '@sistem/types';
import { PORTION_GROUP_IDS, isCategoryOf } from './nutrition.constants';
import { Template } from '../templates/template.model';
import { FoodItem as FoodItemModel } from './foodItem.model';
import { NutritionPlan, NutritionPlanVersion } from './nutritionPlan.model';
import { Recipe } from './nutritionLogs.model';
import { compareFoods, toPublicFoodItem } from './nutritionMapping';
import type { LeanFoodItem } from './nutritionMapping';
import { getEffectiveNutritionConfig } from './nutritionSettings.service';
import { foodKcalProblem } from './nutrition.validation';

// The coach's food list (dashboard). Every query is scoped by coachId: another coach's
// item is simply not found.

export class FoodItemNotFoundError extends Error {}
export class FoodItemValidationError extends Error {}

export async function listCoachFoods(coachId: string): Promise<FoodItem[]> {
  const items = await FoodItemModel.find({ coachId }).lean<LeanFoodItem[]>();
  return items.map(toPublicFoodItem).sort((a, b) => a.group.localeCompare(b.group) || compareFoods(a, b));
}

/** Her items by id (archived included) — for plans, versions and templates. */
export async function findCoachFoods(coachId: string, ids?: readonly string[]): Promise<Map<string, FoodItem>> {
  const filter: Record<string, unknown> = { coachId };
  if (ids) filter._id = { $in: ids };
  const items = await FoodItemModel.find(filter).lean<LeanFoodItem[]>();
  return new Map(items.map((item) => [String(item._id), toPublicFoodItem(item)]));
}

/** Whether the coach has any item that is not archived (the AI nutrition draft needs some). */
export async function coachHasActiveFoods(coachId: string): Promise<boolean> {
  return (await FoodItemModel.exists({ coachId, archivedAt: null, group: { $in: PORTION_GROUP_IDS } })) !== null;
}

async function checkKcal(coachId: string, group: FoodItem['group'], kcal: number | null | undefined): Promise<void> {
  const problem = foodKcalProblem(group, kcal, await getEffectiveNutritionConfig(coachId));
  if (problem) throw new FoodItemValidationError(problem);
}

export async function createCoachFood(coachId: string, input: FoodItemPayload): Promise<FoodItem> {
  const group = input.group!;
  await checkKcal(coachId, group, input.kcal);
  const category = input.category ?? null;
  if (category !== null && !isCategoryOf(group, category)) throw new FoodItemValidationError('That category is not in this group.');
  // New items go to the end of their group unless an order was given.
  const order =
    input.order ??
    ((await FoodItemModel.findOne({ coachId, group }).sort({ order: -1 }).select('order').lean())?.order ?? -1) + 1;
  const created = await FoodItemModel.create({
    coachId,
    group,
    name: input.name,
    portion: input.portion,
    grams: input.grams ?? null,
    kcal: input.kcal ?? null,
    isNewItem: input.isNew ?? false,
    dietTags: input.dietTags ?? [],
    category,
    order,
  });
  return toPublicFoodItem(created.toObject() as LeanFoodItem);
}

export async function updateCoachFood(coachId: string, foodId: string, input: FoodItemPayload): Promise<FoodItem> {
  const item = await FoodItemModel.findOne({ _id: foodId, coachId });
  if (!item) throw new FoodItemNotFoundError('Food item not found.');

  const group = input.group ?? item.group;
  await checkKcal(coachId, group, input.kcal !== undefined ? input.kcal : item.kcal);
  if (input.group !== undefined) item.group = input.group;
  if (input.name !== undefined) item.name = input.name;
  if (input.portion !== undefined) item.portion = input.portion;
  if (input.grams !== undefined) item.grams = input.grams;
  if (input.kcal !== undefined) item.kcal = input.kcal;
  if (input.isNew !== undefined) item.isNewItem = input.isNew;
  if (input.dietTags !== undefined) item.dietTags = input.dietTags;
  if (input.order !== undefined) item.order = input.order;
  if (input.category !== undefined) {
    if (input.category !== null && !isCategoryOf(group, input.category)) {
      throw new FoodItemValidationError('That category is not in this group.');
    }
    item.category = input.category;
  } else if (item.category && !isCategoryOf(group, item.category)) {
    // Moved to another group without a new category: the old one no longer fits.
    item.category = null;
  }
  await item.save();
  return toPublicFoodItem(item.toObject() as LeanFoodItem);
}

/** Used by any plan (working copy or published version), template or recipe. */
export async function isFoodItemUsed(foodId: string): Promise<boolean> {
  const inMeals = { 'meals.options.lines.foodItemId': foodId };
  const checks = await Promise.all([
    NutritionPlan.exists(inMeals),
    NutritionPlanVersion.exists(inMeals),
    Template.exists({ 'nutrition.meals.options.lines.foodItemId': foodId }),
    Recipe.exists({ 'ingredients.foodItemId': foodId }),
  ]);
  return checks.some((found) => found !== null);
}

/** Items a plan or template uses are archived (they keep resolving), never deleted (PRD §5.6). */
export async function deleteCoachFood(coachId: string, foodId: string): Promise<DeleteFoodItemResult> {
  const item = await FoodItemModel.findOne({ _id: foodId, coachId });
  if (!item) throw new FoodItemNotFoundError('Food item not found.');

  if (await isFoodItemUsed(foodId)) {
    item.archivedAt ??= new Date();
    await item.save();
    return { outcome: 'archived', item: toPublicFoodItem(item.toObject() as LeanFoodItem) };
  }
  await FoodItemModel.deleteOne({ _id: foodId, coachId });
  return { outcome: 'deleted', item: null };
}

export async function restoreCoachFood(coachId: string, foodId: string): Promise<FoodItem> {
  const item = await FoodItemModel.findOneAndUpdate(
    { _id: foodId, coachId },
    { $set: { archivedAt: null } },
    { returnDocument: 'after' },
  ).lean<LeanFoodItem>();
  if (!item) throw new FoodItemNotFoundError('Food item not found.');
  return toPublicFoodItem(item);
}

/** How many of her items would be above a new group value (the settings screen refuses those). */
export async function countFoodsAboveCaps(coachId: string, caps: Record<PortionGroup, number>): Promise<number> {
  return FoodItemModel.countDocuments({
    coachId,
    $or: PORTION_GROUP_IDS.map((group) => ({ group, kcal: { $gt: caps[group] } })),
  });
}
