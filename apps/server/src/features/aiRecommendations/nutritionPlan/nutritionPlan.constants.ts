import type { Language } from '@sistem/types';
import { msg, translate, type MessageCode } from '../../../i18n';

// Tunables of the AI nutrition draft (Phase 13c). The prompt lives in nutritionPlanPrompt.ts.

/** Meals in the draft when she gave no "meals per day" answer — the builder's default list. */
export const DEFAULT_MEAL_COUNT = 4;

/**
 * PLACEHOLDER meal names per meals-per-day answer (the coach renames them; owner sends
 * wording), written in the coach's language (Phase 15). 4 = the dashboard's default list for a new plan.
 */
export const MEAL_SLOT_NAMES: Record<number, MessageCode[]> = {
  2: ['meal_breakfast', 'meal_dinner'],
  3: ['meal_breakfast', 'meal_lunch', 'meal_dinner'],
  4: ['meal_breakfast', 'meal_lunch', 'meal_snack', 'meal_dinner'],
  5: ['meal_breakfast', 'meal_lunch', 'meal_snack', 'meal_dinner', 'meal_afternoon_snack'],
  6: ['meal_breakfast', 'meal_lunch', 'meal_snack', 'meal_dinner', 'meal_afternoon_snack', 'meal_evening_snack'],
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

// Option letters per language: A B C / א ב ג.
const OPTION_LETTERS: Record<Language, string[]> = { en: ['A', 'B', 'C'], he: ['א', 'ב', 'ג'] };

/** PLACEHOLDER option labels, like the builder's "+ Option", in the coach's language. */
export function optionLabel(index: number, language: Language): string {
  return translate(language, msg('option_label', { letter: OPTION_LETTERS[language][index] ?? String(index + 1) }));
}

export function mealSlotNames(mealsPerDay: number | null | undefined, language: Language): string[] {
  const codes = MEAL_SLOT_NAMES[mealsPerDay ?? DEFAULT_MEAL_COUNT] ?? MEAL_SLOT_NAMES[DEFAULT_MEAL_COUNT];
  return codes.map((code) => translate(language, code));
}

export function mealSlotId(index: number): string {
  return `M${index + 1}`;
}
