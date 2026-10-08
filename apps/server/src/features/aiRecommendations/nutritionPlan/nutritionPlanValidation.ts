import type { NutritionConfig, NutritionMeal, NutritionPreferences, PortionCounts, PortionGroup } from '@sistem/types';
import { getNutritionFeatures } from '../../../config/features';
import { MAX_LINE_PORTIONS, MAX_MEAL_PORTIONS, PORTION_GROUP_IDS } from '../../nutrition/nutrition.constants';
import { findCoachFoods } from '../../nutrition/foodItem.service';
import { findFoodConflicts, hasKosherConflict, keepsKosher } from '../../nutrition/nutritionPreferences';
import { findNutritionPublishIssues, isPortionCount } from '../../nutrition/nutrition.validation';
import type { FoodCandidate } from './nutritionPlanFoods';
import { MAX_LINES_PER_OPTION, MAX_OPTIONS_PER_MEAL, mealSlotId, optionLabel } from './nutritionPlan.constants';

// Checks a model reply in code (PRD §5.6, 13c). The daily portions are the calculation's
// and must come back EXACTLY; every option must add up to its meal; every food must be one
// that was sent (= the coach's, active, allowed for her). Each problem is a sentence that
// names the meal / option, so it can be sent back to the model on the next attempt.

const MAX_TEXT = 1000;
const MAX_CONSIDERATIONS = 12;
/** The plan's own target rules are the coach's business, not the model's. */
const TARGET_ISSUE_CODES = new Set(['target_missing', 'floor_unconfirmed']);

export interface NutritionPlanValidationContext {
  coachId: string;
  candidates: FoodCandidate[];
  /** Meal names, in slot order (M1 …). */
  slots: string[];
  dailyPortions: PortionCounts;
  kcal: number;
  preferences: NutritionPreferences | null;
  config: NutritionConfig;
}

export interface StoredNutritionLine {
  foodItemId: string;
  group: PortionGroup;
  portions: number;
}

export interface StoredNutritionOption {
  label: string;
  why: string;
  lines: StoredNutritionLine[];
}

export interface StoredNutritionMeal {
  name: string;
  portions: PortionCounts;
  vegetablesFree: boolean;
  why: string;
  options: StoredNutritionOption[];
}

export interface StoredNutritionPlan {
  summary: string;
  considerations: string[];
  kcal: number;
  dailyPortions: PortionCounts;
  meals: StoredNutritionMeal[];
}

export type NutritionPlanValidationResult = { value: StoredNutritionPlan; issues: [] } | { value: null; issues: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '';
}

function emptyCounts(): PortionCounts {
  return { protein: 0, carb: 0, fat: 0, snack: 0 };
}

function describe(counts: PortionCounts): string {
  return PORTION_GROUP_IDS.map((group) => `${counts[group]} ${group}`).join(' · ');
}

/** Pure: the reply's shape and portion rules, against what was sent. */
export function checkNutritionPlanReply(reply: unknown, context: NutritionPlanValidationContext): NutritionPlanValidationResult {
  if (!isRecord(reply) || !Array.isArray(reply.meals)) {
    return { value: null, issues: ['The reply must be an object with a "meals" list.'] };
  }

  const issues: string[] = [];
  const byAlias = new Map(context.candidates.map((candidate) => [candidate.alias, candidate]));
  const rawMeals = reply.meals.filter(isRecord);
  const kosher = keepsKosher(context.preferences);

  const slotLabel = (index: number) => `${mealSlotId(index)} (${context.slots[index] ?? '?'})`;

  if (rawMeals.length !== context.slots.length) {
    issues.push(`Fill exactly ${context.slots.length} meals (${context.slots.map((_, index) => slotLabel(index)).join(', ')}); the reply has ${rawMeals.length}.`);
  }

  const dayTotals = emptyCounts();
  const meals: StoredNutritionMeal[] = [];

  rawMeals.forEach((rawMeal, mealIndex) => {
    const where = slotLabel(mealIndex);
    if (rawMeal.meal !== mealSlotId(mealIndex)) {
      issues.push(`Meal ${mealIndex + 1} must be ${where}, in the given order; the reply has "${String(rawMeal.meal)}".`);
    }

    const rawPortions = isRecord(rawMeal.portions) ? rawMeal.portions : {};
    const portions = emptyCounts();
    let portionsValid = true;
    for (const group of PORTION_GROUP_IDS) {
      const value = rawPortions[group];
      if (!isPortionCount(value, MAX_MEAL_PORTIONS)) {
        issues.push(`${where}: ${group} portions must be 0 to ${MAX_MEAL_PORTIONS} in steps of 0.5.`);
        portionsValid = false;
        continue;
      }
      portions[group] = value;
      dayTotals[group] += value;
    }
    if (portionsValid && PORTION_GROUP_IDS.every((group) => portions[group] === 0)) {
      issues.push(`${where}: the meal has no portions.`);
    }

    const rawOptions = Array.isArray(rawMeal.options) ? rawMeal.options.filter(isRecord) : [];
    if (rawOptions.length === 0 || rawOptions.length > MAX_OPTIONS_PER_MEAL) {
      issues.push(`${where}: give 1 to ${MAX_OPTIONS_PER_MEAL} options; the reply has ${rawOptions.length}.`);
    }

    const options: StoredNutritionOption[] = rawOptions.slice(0, MAX_OPTIONS_PER_MEAL).map((rawOption, optionIndex) => {
      const at = `${where}, option ${optionIndex + 1}`;
      const rawLines = Array.isArray(rawOption.lines) ? rawOption.lines.filter(isRecord) : [];
      if (rawLines.length === 0 || rawLines.length > MAX_LINES_PER_OPTION) {
        issues.push(`${at}: use 1 to ${MAX_LINES_PER_OPTION} food lines; the reply has ${rawLines.length}.`);
      }

      const totals = emptyCounts();
      const seen = new Set<string>();
      const lines: StoredNutritionLine[] = [];
      for (const rawLine of rawLines) {
        const alias = typeof rawLine.food === 'string' ? rawLine.food : '?';
        const candidate = byAlias.get(alias);
        if (!candidate) {
          issues.push(`${at}: ${alias} is not in the food list.`);
          continue;
        }
        const label = `${alias} (${candidate.food.name})`;
        if (seen.has(alias)) issues.push(`${at}: ${label} is used twice in the option.`);
        seen.add(alias);
        if (!isPortionCount(rawLine.portions, MAX_LINE_PORTIONS) || rawLine.portions === 0) {
          issues.push(`${at}: ${label} needs portions above 0, up to ${MAX_LINE_PORTIONS}, in steps of 0.5.`);
          continue;
        }
        totals[candidate.food.group] += rawLine.portions;
        lines.push({ foodItemId: candidate.food.id, group: candidate.food.group, portions: rawLine.portions });
      }

      if (portionsValid && PORTION_GROUP_IDS.some((group) => totals[group] !== portions[group])) {
        issues.push(`${at}: the foods add up to ${describe(totals)} — they must equal the meal's ${describe(portions)}.`);
      }
      if (kosher) {
        const tags = lines.map((line) => context.candidates.find((candidate) => candidate.food.id === line.foodItemId)?.food.dietTags ?? []);
        if (hasKosherConflict(tags)) issues.push(`${at}: meat or poultry and dairy in the same option — she keeps kosher.`);
      }
      return { label: optionLabel(optionIndex), why: text(rawOption.why), lines };
    });

    meals.push({
      name: context.slots[mealIndex] ?? `Meal ${mealIndex + 1}`,
      portions,
      vegetablesFree: rawMeal.vegetablesFree === true,
      why: text(rawMeal.why),
      options,
    });
  });

  for (const group of PORTION_GROUP_IDS) {
    if (dayTotals[group] !== context.dailyPortions[group]) {
      issues.push(`Daily ${group} portions add up to ${dayTotals[group]}; they must be exactly ${context.dailyPortions[group]}.`);
    }
  }

  if (issues.length > 0) return { value: null, issues };
  return {
    value: {
      summary: text(reply.summary),
      considerations: Array.isArray(reply.considerations) ? reply.considerations.map(text).filter(Boolean).slice(0, MAX_CONSIDERATIONS) : [],
      kcal: context.kcal,
      dailyPortions: { ...context.dailyPortions },
      meals,
    },
    issues: [],
  };
}

/** The stored draft as plan meals (ids are placeholders) — for the builder's own publish rules. */
function asPlanMeals(plan: StoredNutritionPlan): NutritionMeal[] {
  return plan.meals.map((meal, mealIndex) => ({
    id: `meal-${mealIndex}`,
    name: meal.name,
    portions: meal.portions,
    vegetablesFree: meal.vegetablesFree,
    options: meal.options.map((option, optionIndex) => ({
      id: `option-${mealIndex}-${optionIndex}`,
      label: option.label,
      lines: option.lines.map((line, lineIndex) => ({
        id: `line-${mealIndex}-${optionIndex}-${lineIndex}`,
        kind: 'food' as const,
        foodItemId: line.foodItemId,
        group: line.group,
        portions: line.portions,
      })),
    })),
  }));
}

/**
 * The reply rules, then the food list as it is NOW (an item could have been archived,
 * moved or re-tagged while the model was working), then the builder's own publish rules.
 */
export async function validateNutritionPlanReply(
  reply: unknown,
  context: NutritionPlanValidationContext,
): Promise<NutritionPlanValidationResult> {
  const checked = checkNutritionPlanReply(reply, context);
  if (!checked.value) return checked;
  const plan = checked.value;

  const ids = [...new Set(plan.meals.flatMap((meal) => meal.options.flatMap((option) => option.lines.map((line) => line.foodItemId))))];
  const foods = await findCoachFoods(context.coachId, ids);
  const issues: string[] = [];
  const aliasOf = new Map(context.candidates.map((candidate) => [candidate.food.id, candidate.alias]));
  for (const id of ids) {
    const food = foods.get(id);
    const label = `${aliasOf.get(id)}${food ? ` (${food.name})` : ''}`;
    if (!food || food.archivedAt) issues.push(`${label} is no longer in the coach's list — choose another food.`);
    else if (food.group !== context.candidates.find((candidate) => candidate.food.id === id)?.food.group) {
      issues.push(`${label} moved to another group — choose another food.`);
    } else if (context.preferences && findFoodConflicts(food.dietTags, context.preferences).length > 0) {
      issues.push(`${label} no longer fits her restrictions — choose another food.`);
    }
  }
  if (issues.length > 0) return { value: null, issues };

  const builderIssues = findNutritionPublishIssues(
    { calorieTarget: { kcal: context.kcal, floorConfirmation: { kcal: context.kcal } }, meals: asPlanMeals(plan) },
    { foods, config: context.config, preferences: context.preferences, features: getNutritionFeatures(), recipeIds: new Set() },
  ).filter((issue) => issue.severity === 'error' && !TARGET_ISSUE_CODES.has(issue.code));
  if (builderIssues.length > 0) return { value: null, issues: builderIssues.map((issue) => issue.message) };

  return checked;
}
