import type { AiNutritionPlanDraft } from '@sistem/types';
import { newKey } from '../nutrition/nutritionDraft';
import type { DraftMeal } from '../nutrition/nutritionDraft';

/**
 * The AI nutrition draft as editable meals — all new rows (no ids). The coach-only "why"
 * stays in the rationale panel: nothing the trainee would see is written by the AI except
 * the meal structure and the food lines, which the coach reviews before publishing.
 */
export function draftMealsFromAi(draft: AiNutritionPlanDraft): DraftMeal[] {
  return draft.meals.map((meal) => ({
    key: newKey(),
    name: meal.name,
    portions: { ...meal.portions },
    vegetablesFree: meal.vegetablesFree,
    options: meal.options.map((option) => ({
      key: newKey(),
      label: option.label,
      lines: option.lines.map((line) => ({
        key: newKey(),
        kind: 'food' as const,
        foodItemId: line.foodItemId,
        group: line.group,
        portions: line.portions,
        text: '',
      })),
    })),
  }));
}
