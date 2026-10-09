import type { AllergyId, DietStyleId, DietType, IntoleranceId, ReligiousId } from '@sistem/types';
import type { sharedCopy } from '@sistem/shared';

// The questionnaire's options: ids (stored, never change) and emoji. Their labels live in the
// shared copy (onboardingOptions.*) by id, so the coach's view of her answers reads the same
// words in the coach's language (Phase 15).
type OptionLabels = (typeof sharedCopy)['he']['onboardingOptions'];

export interface OnboardingOption<Id extends string = string> {
  id: Id;
  emoji?: string;
}

export const GOAL_OPTIONS: OnboardingOption<keyof OptionLabels['goals']>[] = [
  { id: 'build_muscle', emoji: '💪' },
  { id: 'increase_strength', emoji: '🏋️' },
  { id: 'lose_weight', emoji: '⚖️' },
  { id: 'improve_endurance', emoji: '🏃' },
  { id: 'improve_health', emoji: '❤️' },
  { id: 'maintain_active_lifestyle', emoji: '✨' },
  { id: 'move_better', emoji: '🤸' },
];

export const EQUIPMENT_OPTIONS: OnboardingOption<keyof OptionLabels['equipment']>[] = [
  { id: 'full_gym', emoji: '🏋️' },
  { id: 'home_equipment', emoji: '🏠' },
  { id: 'dumbbells', emoji: '🏋️' },
  { id: 'barbell_plates', emoji: '🏋️' },
  { id: 'resistance_bands', emoji: '🧵' },
  { id: 'bench', emoji: '🪑' },
  { id: 'cardio_machines', emoji: '🏃' },
  { id: 'bodyweight_only', emoji: '🤸' },
  { id: 'no_equipment', emoji: '🚫' },
];

export const MUSCLE_FOCUS_OPTIONS: OnboardingOption<keyof OptionLabels['muscleFocus']>[] = [
  { id: 'chest' },
  { id: 'back' },
  { id: 'shoulders' },
  { id: 'arms' },
  { id: 'core' },
  { id: 'glutes' },
  { id: 'legs' },
  { id: 'full_body' },
];

export const RECOVERY_FLAG_OPTIONS: OnboardingOption<keyof OptionLabels['recoveryFlags']>[] = [
  { id: 'returning_after_break' },
  { id: 'prefers_low_impact' },
  { id: 'has_injury_or_limitation' },
  { id: 'has_mobility_restrictions' },
  { id: 'nothing_to_add' },
];

// "Nutrition & goal" step (Phase 13a, v2 in 13a+). Ids mirror the server's nutrition.constants.ts;
// the labels are in the shared copy (nutrition.*), the coach reads the same words.
export const DIET_TYPE_OPTIONS: Exclude<DietType, 'none'>[] = ['vegetarian', 'vegan', 'pescatarian'];
export const DIET_STYLE_OPTIONS: DietStyleId[] = ['keto_low_carb', 'intermittent_fasting', 'other'];
export const RELIGIOUS_OPTIONS: ReligiousId[] = ['kosher', 'halal'];
export const INTOLERANCE_OPTIONS: IntoleranceId[] = ['lactose_free', 'gluten_free', 'celiac', 'low_fodmap', 'other'];
export const ALLERGY_OPTIONS: AllergyId[] = ['dairy', 'eggs', 'peanuts', 'tree_nuts', 'sesame', 'soy', 'gluten', 'fish', 'shellfish', 'other'];
/** Preferred meals per day; null = no preference. */
export const MEALS_PER_DAY_OPTIONS = [2, 3, 4, 5, 6] as const;
