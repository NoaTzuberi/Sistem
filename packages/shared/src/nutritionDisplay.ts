import type {
  AllergyId,
  DietTag,
  DietType,
  FoodGroup,
  NutritionGoal,
  NutritionPreferences,
  NutritionViewLine,
  PortionCounts,
  PortionGroup,
} from '@sistem/types';

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

export const ALLERGY_LABELS: Record<AllergyId, string> = {
  dairy: 'Dairy / lactose',
  eggs: 'Eggs',
  gluten: 'Gluten',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree nuts',
  sesame: 'Sesame',
  soy: 'Soy',
  fish: 'Fish',
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
};

export const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  fat_loss: 'Fat loss',
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

/** One row per preference, for the coach (builder panel, onboarding answers). */
export function describeNutritionPreferences(preferences: NutritionPreferences | null | undefined): { label: string; value: string }[] {
  if (!preferences) return [{ label: 'Nutrition preferences', value: 'Not answered' }];
  const allergies = [
    ...preferences.allergies.map((id) => ALLERGY_LABELS[id] ?? id),
    ...(preferences.allergyNotes ? [`“${preferences.allergyNotes}”`] : []),
  ];
  return [
    { label: 'Diet', value: DIET_TYPE_LABELS[preferences.dietType] ?? preferences.dietType },
    { label: 'Kosher', value: preferences.kosher ? 'Yes' : 'No' },
    { label: 'Allergies & intolerances', value: allergies.join(', ') || 'None' },
    { label: 'Dislikes', value: preferences.dislikes?.trim() || '—' },
  ];
}

/** "Kcal" wording for the coach only — never used on trainee screens. */
export function formatKcal(kcal: number): string {
  return `${kcal.toLocaleString('en-US')} kcal`;
}
