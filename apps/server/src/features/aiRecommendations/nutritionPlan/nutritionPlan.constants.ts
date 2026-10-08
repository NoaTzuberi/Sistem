// Tunables of the AI nutrition draft (Phase 13c). The prompt lives in nutritionPlanPrompt.ts.

/** Meals in the draft when she gave no "meals per day" answer — the builder's default list. */
export const DEFAULT_MEAL_COUNT = 4;

/**
 * PLACEHOLDER meal names per meals-per-day answer (the coach renames them; owner sends
 * wording). 4 = the dashboard's default list for a new plan.
 */
export const MEAL_SLOT_NAMES: Record<number, string[]> = {
  2: ['Breakfast', 'Dinner'],
  3: ['Breakfast', 'Lunch', 'Dinner'],
  4: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
  5: ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Afternoon snack'],
  6: ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Afternoon snack', 'Evening snack'],
};

/** Slots M1…M6: a fixed list, so the reply schema is the same for every request. */
export const MAX_MEAL_SLOTS = 6;

/** Options per meal: the prompt asks for 2; 1–3 pass. */
export const PREFERRED_OPTIONS_PER_MEAL = 2;
export const MAX_OPTIONS_PER_MEAL = 3;
/** Food lines per option. */
export const MAX_LINES_PER_OPTION = 6;

/** Aliases F001…F300: a fixed list (same schema every request). More active items than this are cut. */
export const MAX_FOOD_ALIASES = 300;

/** PLACEHOLDER option labels, like the builder's "+ Option". */
export function optionLabel(index: number): string {
  return `Option ${String.fromCharCode(65 + index)}`;
}

export function mealSlotNames(mealsPerDay: number | null | undefined): string[] {
  return MEAL_SLOT_NAMES[mealsPerDay ?? DEFAULT_MEAL_COUNT] ?? MEAL_SLOT_NAMES[DEFAULT_MEAL_COUNT];
}

export function mealSlotId(index: number): string {
  return `M${index + 1}`;
}
