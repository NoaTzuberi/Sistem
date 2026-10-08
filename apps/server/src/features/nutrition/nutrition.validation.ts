import mongoose from 'mongoose';
import type {
  ApplyNutritionTemplatePayload,
  CalculationOverrides,
  CreateNutritionTemplatePayload,
  DietTag,
  FoodGroup,
  FoodItem,
  FoodItemPayload,
  NutritionConfig,
  NutritionFeatures,
  NutritionIssue,
  NutritionKcal,
  NutritionMeal,
  NutritionOptionLineInput,
  NutritionPreferences,
  NutritionSettingsPayload,
  PortionCounts,
  SaveNutritionPlanPayload,
} from '@sistem/types';
import {
  CALORIE_TARGET_SOURCE_IDS,
  DIET_TAG_IDS,
  FOOD_CATEGORY_IDS,
  FOOD_GROUP_IDS,
  FORMULA_SEX_IDS,
  LINE_KIND_IDS,
  MAX_FOOD_GRAMS,
  MAX_FOOD_NAME_LENGTH,
  MAX_FOOD_PORTION_LENGTH,
  MAX_INTRO_MESSAGE_LENGTH,
  MAX_LINE_PORTIONS,
  MAX_LINE_TEXT_LENGTH,
  MAX_MEALS,
  MAX_MEAL_NAME_LENGTH,
  MAX_MEAL_OPTIONS,
  MAX_MEAL_PORTIONS,
  MAX_OPTION_LABEL_LENGTH,
  MAX_OPTION_LINES,
  MAX_TARGET_KCAL,
  MAX_TEMPLATE_DESCRIPTION_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH,
  MAX_TIPS,
  MAX_TIP_LENGTH,
  MAX_WATER_GOAL_ML,
  MIN_TARGET_KCAL,
  NUTRITION_GOAL_IDS,
  PORTION_GROUP_IDS,
  PORTION_STEP,
  WEIGHT_GOAL_WEEKS_RANGE,
} from './nutrition.constants';
import { NUTRITION_SETTING_BOUNDS } from './nutrition.config';
import { findFoodConflicts, followsKeto, hasKetoConflict, hasKosherConflict, keepsKosher } from './nutritionPreferences';
import type { FoodConflictReason } from './nutritionPreferences';

// Nutrition plan rules live only here, on the server (like plan.validation.ts): the
// dashboard shows `issues` next to the meal / option / line they point at and never
// re-checks a plan itself. Save = shape and limits; publish = the plan makes sense.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

/** An optional id: kept only when it could be a real one (unknown ids get a new id). */
function optionalId(value: unknown): string | undefined {
  return isObjectId(value) ? value : undefined;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** 0, 0.5, 1, … up to max. */
export function isPortionCount(value: unknown, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= max &&
    Number.isInteger(value / PORTION_STEP)
  );
}

function trimmedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

export function validateIdParam(id: unknown, label: string): string | null {
  return isObjectId(id) ? null : `Invalid ${label} id.`;
}

// ---------------------------------------------------------------------------
// Food items
// ---------------------------------------------------------------------------

type FoodItemParse = { value: FoodItemPayload; error: null } | { value: null; error: string };

/**
 * POST (`partial` = false: group, name and portion required) and PATCH (any subset).
 * The kcal cap depends on the coach's config and the item's group, so the service checks it.
 */
export function parseFoodItemPayload(body: unknown, partial: boolean): FoodItemParse {
  if (!isRecord(body)) return { value: null, error: 'Invalid request body.' };
  const value: FoodItemPayload = {};

  if (body.group !== undefined || !partial) {
    if (!isOneOf(body.group, FOOD_GROUP_IDS)) return { value: null, error: 'Group must be protein, carb, fat or vegetable.' };
    value.group = body.group;
  }
  if (body.name !== undefined || !partial) {
    const name = trimmedText(body.name, MAX_FOOD_NAME_LENGTH);
    if (!name) return { value: null, error: `Name is required (max ${MAX_FOOD_NAME_LENGTH} characters).` };
    value.name = name;
  }
  if (body.portion !== undefined || !partial) {
    const portion = trimmedText(body.portion, MAX_FOOD_PORTION_LENGTH);
    if (!portion) return { value: null, error: `Portion is required (max ${MAX_FOOD_PORTION_LENGTH} characters).` };
    value.portion = portion;
  }
  if (body.grams !== undefined) {
    if (body.grams !== null && !(typeof body.grams === 'number' && body.grams > 0 && body.grams <= MAX_FOOD_GRAMS)) {
      return { value: null, error: `Grams must be a number above 0 and at most ${MAX_FOOD_GRAMS}, or empty.` };
    }
    value.grams = body.grams;
  }
  if (body.kcal !== undefined) {
    if (body.kcal !== null && !(typeof body.kcal === 'number' && Number.isFinite(body.kcal) && body.kcal >= 0)) {
      return { value: null, error: 'Calories must be a number of at least 0, or empty.' };
    }
    value.kcal = body.kcal;
  }
  if (body.isNew !== undefined) {
    if (typeof body.isNew !== 'boolean') return { value: null, error: 'isNew must be true or false.' };
    value.isNew = body.isNew;
  }
  if (body.dietTags !== undefined) {
    if (!Array.isArray(body.dietTags) || !body.dietTags.every((tag) => isOneOf(tag, DIET_TAG_IDS))) {
      return { value: null, error: 'Diet tags contain an invalid value.' };
    }
    value.dietTags = [...new Set(body.dietTags as DietTag[])];
  }
  if (body.category !== undefined) {
    // Which group it must belong to is checked in the service (the group may come from the item).
    const known = Object.values(FOOD_CATEGORY_IDS).some((ids) => (ids as readonly unknown[]).includes(body.category));
    if (body.category !== null && !known) return { value: null, error: 'Unknown category.' };
    value.category = body.category as FoodItemPayload['category'];
  }
  if (body.order !== undefined) {
    if (typeof body.order !== 'number' || !Number.isInteger(body.order) || body.order < 0) {
      return { value: null, error: 'Order must be a whole number of at least 0.' };
    }
    value.order = body.order;
  }
  if (partial && Object.keys(value).length === 0) return { value: null, error: 'Nothing to change.' };
  return { value, error: null };
}

/** null = fine; else why this kcal is above the group's cap (or a vegetable has kcal). */
export function foodKcalProblem(group: FoodGroup, kcal: number | null | undefined, config: NutritionConfig): string | null {
  if (kcal === null || kcal === undefined) return null;
  const cap = config.groupKcal[group];
  if (kcal > cap) {
    return group === 'vegetable'
      ? 'Vegetables are free — leave calories empty.'
      : `Calories can't be above the ${group} portion value (${cap} kcal).`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

type SettingsParse = { value: NutritionSettingsPayload; error: null } | { value: null; error: string };

function inRange(value: unknown, { min, max }: { min: number; max: number }): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

/** One number per portion group (already checked). */
function countsOf(record: Record<string, unknown>): PortionCounts {
  return Object.fromEntries(PORTION_GROUP_IDS.map((group) => [group, record[group] as number])) as unknown as PortionCounts;
}

export function parseNutritionSettingsPayload(body: unknown): SettingsParse {
  if (!isRecord(body)) return { value: null, error: 'Invalid request body.' };
  const { groupKcal, goalAdjustments, activityFactors, floorKcal, portionSplit } = body;
  const bounds = NUTRITION_SETTING_BOUNDS;

  if (!isRecord(groupKcal) || !PORTION_GROUP_IDS.every((group) => inRange(groupKcal[group], bounds.groupKcal))) {
    return { value: null, error: `Group values must be between ${bounds.groupKcal.min} and ${bounds.groupKcal.max} kcal.` };
  }
  if (
    !isRecord(goalAdjustments) ||
    !NUTRITION_GOAL_IDS.every((goal) => inRange(goalAdjustments[goal], bounds.goalAdjustmentPct))
  ) {
    return {
      value: null,
      error: `Goal adjustments must be between ${bounds.goalAdjustmentPct.min}% and ${bounds.goalAdjustmentPct.max}%.`,
    };
  }
  if (
    !Array.isArray(activityFactors) ||
    activityFactors.length !== 7 ||
    !activityFactors.every((factor) => inRange(factor, bounds.activityFactor))
  ) {
    return {
      value: null,
      error: `Activity factors: one per training day count (1–7), each between ${bounds.activityFactor.min} and ${bounds.activityFactor.max}.`,
    };
  }
  if (!inRange(floorKcal, bounds.floorKcal) || !Number.isInteger(floorKcal)) {
    return { value: null, error: `The floor must be a whole number between ${bounds.floorKcal.min} and ${bounds.floorKcal.max} kcal.` };
  }
  const scalars = [
    ['kcalPerKg', bounds.kcalPerKg, 'kcal per kg'],
    ['maxLossRatePctPerWeek', bounds.lossRatePct, 'The safe loss rate (% per week)'],
    ['maxGainRatePctPerWeek', bounds.gainRatePct, 'The safe gain rate (% per week)'],
    ['maxDeficitPct', bounds.maxDeficitPct, 'The largest deficit (%)'],
    ['ketoMaxCarbPortions', bounds.ketoMaxCarbPortions, 'Keto carb portions'],
  ] as const;
  for (const [key, range, label] of scalars) {
    if (!inRange(body[key], range)) return { value: null, error: `${label} must be between ${range.min} and ${range.max}.` };
  }
  if (
    !isRecord(portionSplit) ||
    !PORTION_GROUP_IDS.every((group) => inRange(portionSplit[group], bounds.portionSplitPct)) ||
    Math.abs(PORTION_GROUP_IDS.reduce((sum, group) => sum + (portionSplit[group] as number), 0) - 100) > 0.01
  ) {
    return { value: null, error: 'The portion split is a % per group and adds up to 100.' };
  }
  return {
    value: {
      groupKcal: countsOf(groupKcal),
      goalAdjustments: Object.fromEntries(NUTRITION_GOAL_IDS.map((goal) => [goal, goalAdjustments[goal] as number])) as NutritionSettingsPayload['goalAdjustments'],
      activityFactors: activityFactors as number[],
      floorKcal,
      kcalPerKg: body.kcalPerKg as number,
      maxLossRatePctPerWeek: body.maxLossRatePctPerWeek as number,
      maxGainRatePctPerWeek: body.maxGainRatePctPerWeek as number,
      maxDeficitPct: body.maxDeficitPct as number,
      portionSplit: countsOf(portionSplit),
      ketoMaxCarbPortions: body.ketoMaxCarbPortions as number,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Nutrition plan — save payload (the coach's working copy, autosaved)
// ---------------------------------------------------------------------------

type PlanParse = { value: SaveNutritionPlanPayload; issues: [] } | { value: null; issues: NutritionIssue[] };

function invalid(message: string, at: Partial<Pick<NutritionIssue, 'mealIndex' | 'optionIndex' | 'lineIndex'>> = {}): NutritionIssue {
  return { severity: 'error', code: 'invalid', message, ...at };
}

// The coach's values in the calculation summary — wide limits, like her onboarding answers.
const OVERRIDE_BOUNDS: Record<keyof CalculationOverrides, { min: number; max: number; integer?: boolean; label: string }> = {
  weightKg: { min: 20, max: 400, label: 'Weight (kg)' },
  heightCm: { min: 50, max: 300, label: 'Height (cm)' },
  ageYears: { min: 5, max: 120, integer: true, label: 'Age' },
  activityFactor: { ...NUTRITION_SETTING_BOUNDS.activityFactor, label: 'The activity factor' },
  targetWeightKg: { min: 20, max: 400, label: 'Target weight (kg)' },
  timelineWeeks: { ...WEIGHT_GOAL_WEEKS_RANGE, integer: true, label: 'The timeframe (weeks)' },
};

/** Each override a number in its range, or null (her data). Missing keys = null. */
export function parseCalculationOverrides(value: unknown): { value: CalculationOverrides; error: null } | { value: null; error: string } {
  if (!isRecord(value)) return { value: null, error: 'Invalid calculation overrides.' };
  const overrides = {} as CalculationOverrides;
  for (const [key, bounds] of Object.entries(OVERRIDE_BOUNDS) as [keyof CalculationOverrides, (typeof OVERRIDE_BOUNDS)[keyof CalculationOverrides]][]) {
    const raw = value[key] ?? null;
    if (raw !== null && (!inRange(raw, bounds) || (bounds.integer && !Number.isInteger(raw)))) {
      return { value: null, error: `${bounds.label} must be between ${bounds.min} and ${bounds.max}.` };
    }
    overrides[key] = raw as number | null;
  }
  return { value: overrides, error: null };
}

function parsePortionCounts(value: unknown): PortionCounts | null {
  if (!isRecord(value)) return null;
  const counts = {} as PortionCounts;
  for (const group of PORTION_GROUP_IDS) {
    const count = value[group] ?? 0;
    if (!isPortionCount(count, MAX_MEAL_PORTIONS)) return null;
    counts[group] = count;
  }
  return counts;
}

/**
 * PUT /coach/trainees/:id/nutrition-plan. Shape, limits and the closed features only —
 * whether the plan can be published is findNutritionPublishIssues().
 */
export function parseSaveNutritionPlanPayload(body: unknown, features: NutritionFeatures): PlanParse {
  if (!isRecord(body)) return { value: null, issues: [invalid('Invalid request body.')] };
  const issues: NutritionIssue[] = [];

  // Calorie target.
  const target = body.calorieTarget;
  let calorieTarget: SaveNutritionPlanPayload['calorieTarget'] | null = null;
  if (!isRecord(target)) {
    issues.push(invalid('The calorie target is missing.'));
  } else {
    const kcal = target.kcal ?? null;
    const source = target.source ?? null;
    const formulaSex = target.formulaSex ?? null;
    // Omitted = keep the stored ones.
    const overrides = target.overrides !== undefined ? parseCalculationOverrides(target.overrides) : null;
    if (kcal !== null && !(typeof kcal === 'number' && Number.isInteger(kcal) && kcal >= MIN_TARGET_KCAL && kcal <= MAX_TARGET_KCAL)) {
      issues.push(invalid(`The target must be a whole number between ${MIN_TARGET_KCAL} and ${MAX_TARGET_KCAL} kcal.`));
    } else if (source !== null && !isOneOf(source, CALORIE_TARGET_SOURCE_IDS)) {
      issues.push(invalid('The target source must be suggested or override.'));
    } else if (!isOneOf(target.goal, NUTRITION_GOAL_IDS)) {
      issues.push(invalid('The goal must be fat loss, aggressive fat loss, recomp, muscle gain or maintenance.'));
    } else if (formulaSex !== null && !isOneOf(formulaSex, FORMULA_SEX_IDS)) {
      issues.push(invalid('The formula must be male or female.'));
    } else if (target.confirmBelowFloor !== undefined && typeof target.confirmBelowFloor !== 'boolean') {
      issues.push(invalid('confirmBelowFloor must be true or false.'));
    } else if (overrides?.error) {
      issues.push(invalid(overrides.error));
    } else {
      calorieTarget = {
        ...(overrides?.value ? { overrides: overrides.value } : {}),
        kcal: kcal as number | null,
        // A target without a number has no source.
        source: kcal === null ? null : ((source ?? 'override') as 'suggested' | 'override'),
        goal: target.goal,
        formulaSex: formulaSex as 'male' | 'female' | null,
        confirmBelowFloor: target.confirmBelowFloor === true,
      };
    }
  }

  // Meals → options → lines.
  const meals: SaveNutritionPlanPayload['meals'] = [];
  if (!Array.isArray(body.meals)) {
    issues.push(invalid('Meals must be a list.'));
  } else if (body.meals.length > MAX_MEALS) {
    issues.push(invalid(`A plan has at most ${MAX_MEALS} meals.`));
  } else {
    body.meals.forEach((rawMeal, mealIndex) => {
      if (!isRecord(rawMeal)) {
        issues.push(invalid('Invalid meal.', { mealIndex }));
        return;
      }
      const name = trimmedText(rawMeal.name, MAX_MEAL_NAME_LENGTH);
      const portions = parsePortionCounts(rawMeal.portions);
      if (!name) issues.push(invalid(`A meal needs a name (max ${MAX_MEAL_NAME_LENGTH} characters).`, { mealIndex }));
      if (!portions) {
        issues.push(invalid(`Portions go in steps of ${PORTION_STEP}, from 0 to ${MAX_MEAL_PORTIONS}.`, { mealIndex }));
      }
      const rawOptions = rawMeal.options ?? [];
      if (!Array.isArray(rawOptions) || rawOptions.length > MAX_MEAL_OPTIONS) {
        issues.push(invalid(`A meal has at most ${MAX_MEAL_OPTIONS} options.`, { mealIndex }));
        return;
      }
      const options = rawOptions.flatMap((rawOption: unknown, optionIndex: number) => {
        if (!isRecord(rawOption)) {
          issues.push(invalid('Invalid option.', { mealIndex, optionIndex }));
          return [];
        }
        const label = trimmedText(rawOption.label, MAX_OPTION_LABEL_LENGTH);
        if (!label) {
          issues.push(invalid(`An option needs a label (max ${MAX_OPTION_LABEL_LENGTH} characters).`, { mealIndex, optionIndex }));
        }
        const rawLines = rawOption.lines ?? [];
        if (!Array.isArray(rawLines) || rawLines.length > MAX_OPTION_LINES) {
          issues.push(invalid(`An option has at most ${MAX_OPTION_LINES} lines.`, { mealIndex, optionIndex }));
          return [];
        }
        const lines = rawLines.flatMap((rawLine: unknown, lineIndex: number): NutritionOptionLineInput[] => {
          const at = { mealIndex, optionIndex, lineIndex };
          if (!isRecord(rawLine) || !isOneOf(rawLine.kind, LINE_KIND_IDS)) {
            issues.push(invalid('A line is a food item, a recipe or text.', at));
            return [];
          }
          const portionsValue = rawLine.portions ?? null;
          const id = optionalId(rawLine.id);
          if (rawLine.kind === 'food') {
            if (!isObjectId(rawLine.foodItemId)) {
              issues.push(invalid('Pick a food item.', at));
              return [];
            }
            if (!isPortionCount(portionsValue, MAX_LINE_PORTIONS) || portionsValue === 0) {
              issues.push(invalid(`Portions go in steps of ${PORTION_STEP}, above 0 and up to ${MAX_LINE_PORTIONS}.`, at));
              return [];
            }
            return [{ id, kind: 'food' as const, foodItemId: rawLine.foodItemId, portions: portionsValue }];
          }
          if (rawLine.kind === 'recipe') {
            if (!features.nutritionRecipes) {
              issues.push(invalid('Recipes are not available.', at));
              return [];
            }
            if (!isObjectId(rawLine.recipeId) || !isPortionCount(portionsValue, MAX_LINE_PORTIONS) || portionsValue === 0) {
              issues.push(invalid('Pick a recipe and its servings.', at));
              return [];
            }
            return [{ id, kind: 'recipe' as const, recipeId: rawLine.recipeId, portions: portionsValue }];
          }
          // Free text, e.g. "cut vegetables — free", or a food the list doesn't have (counted in a group).
          const text = trimmedText(rawLine.text, MAX_LINE_TEXT_LENGTH);
          const group = rawLine.group ?? null;
          if (!text) {
            issues.push(invalid(`A text line needs text (max ${MAX_LINE_TEXT_LENGTH} characters).`, at));
            return [];
          }
          if (group !== null && !isOneOf(group, FOOD_GROUP_IDS)) {
            issues.push(invalid('Invalid group.', at));
            return [];
          }
          const counted = group !== null && group !== 'vegetable';
          if (counted && (!isPortionCount(portionsValue, MAX_LINE_PORTIONS) || portionsValue === 0)) {
            issues.push(invalid(`A text line in a group needs portions in steps of ${PORTION_STEP}.`, at));
            return [];
          }
          return [{ id, kind: 'text' as const, text, group: group as FoodGroup | null, portions: counted ? (portionsValue as number) : null }];
        });
        return label ? [{ id: optionalId(rawOption.id), label, lines }] : [];
      });
      if (name && portions) {
        meals.push({ id: optionalId(rawMeal.id), name, portions, vegetablesFree: rawMeal.vegetablesFree === true, options });
      }
    });
  }

  // Tips.
  const tips: SaveNutritionPlanPayload['tips'] = [];
  const rawTips = body.tips ?? [];
  if (!Array.isArray(rawTips) || rawTips.length > MAX_TIPS) {
    issues.push(invalid(`At most ${MAX_TIPS} tips.`));
  } else {
    for (const rawTip of rawTips) {
      const text = isRecord(rawTip) ? trimmedText(rawTip.text, MAX_TIP_LENGTH) : null;
      if (!text) {
        issues.push(invalid(`A tip needs text (max ${MAX_TIP_LENGTH} characters).`));
        continue;
      }
      tips.push({ id: optionalId((rawTip as Record<string, unknown>).id), text });
    }
  }

  // 13b: water goal, only while the feature is open.
  let waterGoalMl: number | null | undefined;
  if (body.waterGoalMl !== undefined) {
    if (!features.waterTracking) {
      issues.push(invalid('Water tracking is not available.'));
    } else if (
      body.waterGoalMl !== null &&
      !(typeof body.waterGoalMl === 'number' && Number.isInteger(body.waterGoalMl) && body.waterGoalMl >= 0 && body.waterGoalMl <= MAX_WATER_GOAL_ML)
    ) {
      issues.push(invalid(`The water goal must be a whole number of ml up to ${MAX_WATER_GOAL_ML}.`));
    } else {
      waterGoalMl = body.waterGoalMl as number | null;
    }
  }

  // The coach's intro: plain text, line breaks kept (only the ends are trimmed).
  let introMessage: string | null | undefined;
  if (body.introMessage !== undefined) {
    if (body.introMessage === null) introMessage = null;
    else if (typeof body.introMessage !== 'string' || body.introMessage.trim().length > MAX_INTRO_MESSAGE_LENGTH) {
      issues.push(invalid(`The intro message is text of at most ${MAX_INTRO_MESSAGE_LENGTH} characters.`));
    } else {
      introMessage = body.introMessage.replace(/\r\n/g, '\n').trim() || null;
    }
  }

  if (issues.length > 0 || !calorieTarget) {
    return { value: null, issues: issues.length > 0 ? issues : [invalid('Invalid request body.')] };
  }
  return {
    value: {
      calorieTarget,
      meals,
      tips,
      ...(waterGoalMl !== undefined ? { waterGoalMl } : {}),
      ...(introMessage !== undefined ? { introMessage } : {}),
    },
    issues: [],
  };
}

// ---------------------------------------------------------------------------
// Publish rules and kcal
// ---------------------------------------------------------------------------

/** Meal kcal = its portions × the group values (never from individual foods, PRD §5.6). */
export function computeNutritionKcal(
  meals: readonly Pick<NutritionMeal, 'id' | 'portions'>[],
  groupKcal: NutritionConfig['groupKcal'],
): NutritionKcal {
  const mealKcal = meals.map((meal) => ({
    mealId: meal.id,
    kcal: Math.round(PORTION_GROUP_IDS.reduce((sum, group) => sum + meal.portions[group] * groupKcal[group], 0)),
  }));
  return { meals: mealKcal, day: mealKcal.reduce((sum, meal) => sum + meal.kcal, 0) };
}

export interface PublishCheckInput {
  calorieTarget: { kcal: number | null; floorConfirmation: { kcal: number } | null };
  meals: NutritionMeal[];
}

export interface PublishCheckContext {
  /** The coach's food list (archived included). A missing id = not hers / deleted. */
  foods: Map<string, Pick<FoodItem, 'group' | 'name' | 'archivedAt' | 'dietTags'>>;
  config: NutritionConfig;
  preferences: NutritionPreferences | null;
  features: NutritionFeatures;
  /** Recipe ids that exist, are hers and not archived (13b; empty while closed). */
  recipeIds: Set<string>;
}

// Coach-facing wording for the answer behind a conflict (placeholder, like the rest).
const CONFLICT_SOURCE_LABELS: Record<string, string> = {
  lactose_free: 'lactose-free',
  gluten_free: 'gluten-free',
  low_fodmap: 'low-FODMAP',
};

function describeConflict(reason: FoodConflictReason): string {
  const tag = reason.tag.replace('_', ' ');
  if (reason.kind === 'allergy') return `contains ${tag} (her allergy)`;
  return `contains ${tag} (${CONFLICT_SOURCE_LABELS[reason.source] ?? reason.source.replace('_', ' ')})`;
}

/** The meals' portions summed over the day. */
export function sumDayPortions(meals: readonly Pick<NutritionMeal, 'portions'>[]): PortionCounts {
  const total: PortionCounts = { protein: 0, carb: 0, fat: 0, snack: 0 };
  for (const meal of meals) for (const group of PORTION_GROUP_IDS) total[group] += meal.portions[group];
  return total;
}

/**
 * Errors block publishing; warnings are shown and don't. Every problem points at the
 * meal / option / line it belongs to.
 */
export function findNutritionPublishIssues(plan: PublishCheckInput, context: PublishCheckContext): NutritionIssue[] {
  const issues: NutritionIssue[] = [];
  const { foods, config, preferences } = context;
  const { kcal, floorConfirmation } = plan.calorieTarget;

  if (kcal === null) {
    issues.push({ severity: 'error', code: 'target_missing', message: 'Set a calorie target.' });
  } else if (kcal < config.floorKcal && floorConfirmation?.kcal !== kcal) {
    issues.push({
      severity: 'error',
      code: 'floor_unconfirmed',
      message: `The target is below ${config.floorKcal} kcal — confirm it to publish.`,
    });
  }
  if (plan.meals.length === 0) {
    issues.push({ severity: 'error', code: 'no_meals', message: 'Add at least one meal.' });
  }

  plan.meals.forEach((meal, mealIndex) => {
    const mealPortions = PORTION_GROUP_IDS.reduce((sum, group) => sum + meal.portions[group], 0);
    if (mealPortions === 0) {
      issues.push({ severity: 'warning', code: 'meal_no_portions', message: `${meal.name}: no portions set.`, mealIndex });
    }

    meal.options.forEach((option, optionIndex) => {
      const where = `${meal.name} · ${option.label}`;
      if (option.lines.length === 0) {
        issues.push({ severity: 'error', code: 'option_empty', message: `${where}: the option has no lines.`, mealIndex, optionIndex });
        return;
      }

      const totals: PortionCounts = { protein: 0, carb: 0, fat: 0, snack: 0 };
      const optionTags: DietTag[][] = [];
      option.lines.forEach((line, lineIndex) => {
        const at = { mealIndex, optionIndex, lineIndex };
        if (line.kind === 'recipe') {
          if (!context.features.nutritionRecipes || !line.recipeId || !context.recipeIds.has(line.recipeId)) {
            issues.push({ severity: 'error', code: 'recipe_unavailable', message: `${where}: that recipe is not available.`, ...at });
          }
          return;
        }
        if (line.kind === 'text') {
          if (line.group && line.group !== 'vegetable' && line.portions) totals[line.group] += line.portions;
          return;
        }
        const food = line.foodItemId ? foods.get(line.foodItemId) : undefined;
        if (!food) {
          issues.push({ severity: 'error', code: 'food_missing', message: `${where}: a food item is no longer in the list.`, ...at });
          return;
        }
        if (food.archivedAt) {
          issues.push({ severity: 'error', code: 'food_archived', message: `${where}: "${food.name}" is archived — replace it.`, ...at });
        }
        if (line.group !== food.group) {
          issues.push({
            severity: 'error',
            code: 'food_group_mismatch',
            message: `${where}: "${food.name}" is now in the ${food.group} group — re-add it.`,
            ...at,
          });
        }
        if (food.group !== 'vegetable' && line.portions) totals[food.group] += line.portions;
        optionTags.push(food.dietTags);
        if (preferences) {
          const conflicts = findFoodConflicts(food.dietTags, preferences);
          if (conflicts.length > 0) {
            issues.push({
              severity: 'warning',
              code: 'preference_conflict',
              message: `${where}: "${food.name}" ${conflicts.map(describeConflict).join(', ')}.`,
              ...at,
            });
          }
        }
      });

      if (keepsKosher(preferences) && hasKosherConflict(optionTags)) {
        issues.push({
          severity: 'warning',
          code: 'kosher_conflict',
          message: `${where}: meat and dairy in the same option (she keeps kosher).`,
          mealIndex,
          optionIndex,
        });
      }
      const differs = PORTION_GROUP_IDS.filter((group) => totals[group] !== meal.portions[group]);
      if (differs.length > 0) {
        // Snack only when either side has some (most meals have none).
        const shown = PORTION_GROUP_IDS.filter((group) => group !== 'snack' || totals.snack > 0 || meal.portions.snack > 0);
        const describe = (counts: PortionCounts) => shown.map((group) => `${counts[group]} ${group}`).join(' · ');
        issues.push({
          severity: 'warning',
          code: 'option_portions_mismatch',
          message: `${where}: ${describe(totals)} — the meal has ${describe(meal.portions)}.`,
          mealIndex,
          optionIndex,
        });
      }
    });
  });

  const dayPortions = sumDayPortions(plan.meals);
  if (followsKeto(preferences) && hasKetoConflict(dayPortions, config.ketoMaxCarbPortions)) {
    issues.push({
      severity: 'warning',
      code: 'keto_conflict',
      message: `${dayPortions.carb + dayPortions.snack} carb / snack portions a day — she eats keto / low-carb (your limit: ${config.ketoMaxCarbPortions}).`,
    });
  }

  return issues;
}

export function hasBlockingIssues(issues: readonly NutritionIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

type Parse<T> = { value: T; error: null } | { value: null; error: string };

export function parseCreateNutritionTemplatePayload(body: unknown): Parse<CreateNutritionTemplatePayload> {
  if (!isRecord(body)) return { value: null, error: 'Invalid request body.' };
  const name = trimmedText(body.name, MAX_TEMPLATE_NAME_LENGTH);
  if (!name) return { value: null, error: `A template needs a name (max ${MAX_TEMPLATE_NAME_LENGTH} characters).` };
  if (!isMissing(body.description) && (typeof body.description !== 'string' || body.description.length > MAX_TEMPLATE_DESCRIPTION_LENGTH)) {
    return { value: null, error: `The description is at most ${MAX_TEMPLATE_DESCRIPTION_LENGTH} characters.` };
  }
  const description = typeof body.description === 'string' ? body.description.trim() || undefined : undefined;
  return { value: { name, description }, error: null };
}

export function parseApplyNutritionTemplatePayload(body: unknown): Parse<ApplyNutritionTemplatePayload> {
  if (!isRecord(body) || !isObjectId(body.templateId)) return { value: null, error: 'Pick a template.' };
  return { value: { templateId: body.templateId }, error: null };
}
