import type {
  AllergyId,
  DietStyleId,
  DietTag,
  DietType,
  FoodGroup,
  IntoleranceId,
  MealLogDay,
  NutritionGoal,
  NutritionPreferences,
  NutritionViewLine,
  PortionCounts,
  PortionGroup,
  PreferenceItem,
  ReligiousId,
  WeightGoal,
  WeightUnit,
} from '@sistem/types';
import { formatDateOnly } from './format';
import { formatWeight } from './units';

// Read-only wording for nutrition (Phase 13a), shared by the dashboard builder, the
// trainee's Nutrition tab and coach mode. PLACEHOLDER wording — the owner sends the final
// copy (Phase 15 moves it into the translation files). Coach content (food names,
// portions, meal names, tips) is always shown exactly as she wrote it.

export const PORTION_GROUPS: readonly PortionGroup[] = ['protein', 'carb', 'fat'];
export const FOOD_GROUPS: readonly FoodGroup[] = ['protein', 'carb', 'fat', 'vegetable'];

export const FOOD_GROUP_LABELS: Record<FoodGroup, string> = {
  protein: 'Protein',
  carb: 'Carb',
  fat: 'Fat',
  vegetable: 'Vegetables',
};

/** The word after a count: "1 protein", "1½ carb". */
const PORTION_WORDS: Record<PortionGroup, string> = { protein: 'protein', carb: 'carb', fat: 'fat' };

export const VEGETABLES_FREE_LABEL = 'vegetables free';

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  none: 'No restrictions',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
};

export const DIET_STYLE_LABELS: Record<DietStyleId, string> = {
  keto_low_carb: 'Keto / low-carb',
  intermittent_fasting: 'Intermittent fasting',
  other: 'Other',
};

export const RELIGIOUS_LABELS: Record<ReligiousId, string> = {
  kosher: 'Kosher',
  halal: 'Halal',
};

export const INTOLERANCE_LABELS: Record<IntoleranceId, string> = {
  lactose_free: 'Lactose-free',
  gluten_free: 'Gluten-free',
  celiac: 'Celiac',
  low_fodmap: 'Low-FODMAP',
  other: 'Other',
};

export const ALLERGY_LABELS: Record<AllergyId, string> = {
  dairy: 'Dairy',
  eggs: 'Eggs',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree nuts',
  sesame: 'Sesame',
  soy: 'Soy',
  gluten: 'Gluten / wheat',
  fish: 'Fish',
  shellfish: 'Shellfish',
  other: 'Other',
};

export const DIET_TAG_LABELS: Record<DietTag, string> = {
  meat: 'Meat',
  poultry: 'Poultry',
  fish: 'Fish',
  dairy: 'Dairy',
  eggs: 'Eggs',
  gluten: 'Gluten',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree nuts',
  sesame: 'Sesame',
  soy: 'Soy',
  shellfish: 'Shellfish',
  pork: 'Pork',
  lactose: 'Lactose',
  alcohol: 'Alcohol',
  high_fodmap: 'High-FODMAP',
};

export const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  fat_loss: 'Fat loss',
  fat_loss_aggressive: 'Fat loss (aggressive)',
  recomp: 'Toning / recomp',
  muscle_gain: 'Muscle gain',
  maintenance: 'Maintenance',
};

/** 0.5 → '½', 1.5 → '1½', 2 → '2'. Portions only ever go in halves. */
export function formatPortionCount(count: number): string {
  const whole = Math.floor(count);
  const half = count - whole >= 0.5;
  if (!half) return String(whole);
  return whole === 0 ? '½' : `${whole}½`;
}

/** '1 protein' */
export function describePortion(group: PortionGroup, count: number): string {
  return `${formatPortionCount(count)} ${PORTION_WORDS[group]}`;
}

/** The groups a meal counts, in order, without the zeros. */
export function mealPortionList(portions: PortionCounts): { group: PortionGroup; count: number }[] {
  return PORTION_GROUPS.filter((group) => portions[group] > 0).map((group) => ({ group, count: portions[group] }));
}

/** '1 protein · 1 carb · 1 fat · vegetables free' (PRD §5.6). */
export function describeMealPortions(portions: PortionCounts, vegetablesFree: boolean): string {
  const parts = mealPortionList(portions).map(({ group, count }) => describePortion(group, count));
  if (vegetablesFree) parts.push(VEGETABLES_FREE_LABEL);
  return parts.join(' · ') || '—';
}

/**
 * How much of an item a line means: its portion as the coach wrote it, times the count
 * when it is not exactly one ('½ × 2 eggs').
 */
export function describePortionAmount(portion: string, count: number | null): string {
  if (count === null || count === 1) return portion;
  return `${formatPortionCount(count)} × ${portion}`;
}

/** A line of a meal option as the trainee reads it (name, amount; free text as written). */
export function describeViewLine(line: NutritionViewLine): { title: string; detail: string | null } {
  if (line.food) return { title: line.food.name, detail: describePortionAmount(line.food.portion, line.portions) };
  const counted = line.group && line.group !== 'vegetable' && line.portions;
  return { title: line.text ?? '', detail: counted ? describePortion(line.group as PortionGroup, line.portions!) : null };
}

/** 'Lactose-free (ok in yogurt)', 'Other: kiwi' — an item with her own words. */
export function describePreferenceItem<T extends string>(item: PreferenceItem<T>, labels: Record<T, string>): string {
  const label = labels[item.id] ?? item.id;
  if (!item.details) return label;
  return item.id === 'other' ? item.details : `${label} (${item.details})`;
}

function describeItems<T extends string>(items: readonly PreferenceItem<T>[], labels: Record<T, string>): string {
  return items.map((item) => describePreferenceItem(item, labels)).join(', ');
}

/** "How I eat" in one line: 'Vegetarian · Kosher · 4 meals' ('' = nothing chosen). */
export function summarizeHowIEat(preferences: NutritionPreferences): string {
  return [
    ...(preferences.dietType !== 'none' ? [DIET_TYPE_LABELS[preferences.dietType]] : []),
    ...preferences.dietStyles.map((item) => (item.id === 'other' ? item.details || DIET_STYLE_LABELS.other : DIET_STYLE_LABELS[item.id])),
    ...preferences.religious.map((item) => RELIGIOUS_LABELS[item.id]),
    ...(preferences.mealsPerDay ? [`${preferences.mealsPerDay} meals`] : []),
  ].join(' · ');
}

/** "Intolerances & allergies" in one line: 'Lactose-free · Peanuts' ('' = none chosen). */
export function summarizeRestrictions(preferences: NutritionPreferences): string {
  return [
    ...preferences.intolerances.map((item) => (item.id === 'other' ? item.details || INTOLERANCE_LABELS.other : INTOLERANCE_LABELS[item.id])),
    ...preferences.allergies.map((item) => (item.id === 'other' ? item.details || ALLERGY_LABELS.other : ALLERGY_LABELS[item.id])),
  ].join(' · ');
}

/** '62 kg · 12 weeks' / '62 kg · by 3 Dec 2026' / '62 kg' — in the reader's unit. */
export function describeWeightGoal(goal: Pick<WeightGoal, 'targetWeightKg' | 'timeframe'>, unit: WeightUnit = 'kg'): string {
  const target = formatWeight(goal.targetWeightKg, unit);
  if (!goal.timeframe) return target;
  return goal.timeframe.kind === 'weeks'
    ? `${target} · ${goal.timeframe.weeks} week${goal.timeframe.weeks === 1 ? '' : 's'}`
    : `${target} · by ${formatDateOnly(goal.timeframe.date)}`;
}

/** One row per preference, for the coach (builder panel, onboarding answers). */
export function describeNutritionPreferences(preferences: NutritionPreferences | null | undefined): { label: string; value: string }[] {
  if (!preferences) return [{ label: 'Nutrition preferences', value: 'Not answered' }];
  const diet = DIET_TYPE_LABELS[preferences.dietType] ?? preferences.dietType;
  return [
    { label: 'Diet', value: preferences.dietTypeDetails ? `${diet} (${preferences.dietTypeDetails})` : diet },
    { label: 'Diet style', value: describeItems(preferences.dietStyles, DIET_STYLE_LABELS) || '—' },
    { label: 'Religious', value: describeItems(preferences.religious, RELIGIOUS_LABELS) || '—' },
    { label: 'Intolerances', value: describeItems(preferences.intolerances, INTOLERANCE_LABELS) || 'None' },
    { label: 'Allergies', value: describeItems(preferences.allergies, ALLERGY_LABELS) || 'None' },
    { label: 'Loves', value: preferences.foodsLoved?.trim() || '—' },
    { label: 'Dislikes', value: preferences.foodsDisliked?.trim() || '—' },
    { label: 'Meals per day', value: preferences.mealsPerDay ? String(preferences.mealsPerDay) : 'No preference' },
  ];
}

/** Portion tracking, neutral wording (no judgment): '2 of 4½'. */
export function describeMarked(eaten: number, planned: number): string {
  return `${formatPortionCount(eaten)} of ${formatPortionCount(planned)}`;
}

export type TrackingDayStatus = 'future' | 'no_plan' | 'not_marked' | 'marked';

/**
 * One tracked day for the coach (both apps): what to show and, per planned group,
 * "marked of planned". Neutral — no scores, no colors that judge.
 */
export function describeTrackingDay(
  day: Pick<MealLogDay, 'date' | 'planned' | 'eaten' | 'logged' | 'planVersion'>,
  today: string,
): { status: TrackingDayStatus; groups: { group: PortionGroup; label: string; text: string }[] } {
  const groups = PORTION_GROUPS.filter((group) => day.planned[group] > 0).map((group) => ({
    group,
    label: FOOD_GROUP_LABELS[group],
    text: describeMarked(day.eaten[group], day.planned[group]),
  }));
  if (day.date > today) return { status: 'future', groups: [] };
  if (day.planVersion === null || groups.length === 0) return { status: 'no_plan', groups: [] };
  return { status: day.logged ? 'marked' : 'not_marked', groups };
}

/** "Kcal" wording for the coach only — never used on trainee screens. */
export function formatKcal(kcal: number): string {
  return `${kcal.toLocaleString('en-US')} kcal`;
}
