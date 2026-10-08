import type { AllergyId, DietStyleId, DietType, IntoleranceId, ReligiousId } from '@sistem/types';
import { ALLERGY_LABELS, DIET_STYLE_LABELS, DIET_TYPE_LABELS, INTOLERANCE_LABELS, RELIGIOUS_LABELS } from '@sistem/shared';

export interface OnboardingOption {
  id: string;
  label: string;
  emoji?: string;
}

export const GOAL_OPTIONS: OnboardingOption[] = [
  { id: 'build_muscle', label: 'Build muscle', emoji: '💪' },
  { id: 'increase_strength', label: 'Increase strength', emoji: '🏋️' },
  { id: 'lose_weight', label: 'Lose weight', emoji: '⚖️' },
  { id: 'improve_endurance', label: 'Improve endurance', emoji: '🏃' },
  { id: 'improve_health', label: 'Improve health', emoji: '❤️' },
  { id: 'maintain_active_lifestyle', label: 'Maintain an active lifestyle', emoji: '✨' },
  { id: 'move_better', label: 'Move better', emoji: '🤸' },
];

export const EQUIPMENT_OPTIONS: OnboardingOption[] = [
  { id: 'full_gym', label: 'Full gym', emoji: '🏋️' },
  { id: 'home_equipment', label: 'Home equipment', emoji: '🏠' },
  { id: 'dumbbells', label: 'Dumbbells', emoji: '🏋️' },
  { id: 'barbell_plates', label: 'Barbell and plates', emoji: '🏋️' },
  { id: 'resistance_bands', label: 'Resistance bands', emoji: '🧵' },
  { id: 'bench', label: 'Bench', emoji: '🪑' },
  { id: 'cardio_machines', label: 'Cardio machines', emoji: '🏃' },
  { id: 'bodyweight_only', label: 'Bodyweight only', emoji: '🤸' },
  { id: 'no_equipment', label: 'No equipment', emoji: '🚫' },
];

export const MUSCLE_FOCUS_OPTIONS: OnboardingOption[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'legs', label: 'Legs' },
  { id: 'full_body', label: 'Full body' },
];

export const RECOVERY_FLAG_OPTIONS: OnboardingOption[] = [
  { id: 'returning_after_break', label: "I'm returning after time away" },
  { id: 'prefers_low_impact', label: 'I prefer low-impact training' },
  { id: 'has_injury_or_limitation', label: 'I have an injury or limitation' },
  { id: 'has_mobility_restrictions', label: 'I have mobility restrictions' },
  { id: 'nothing_to_add', label: 'Nothing to add' },
];

// "Nutrition & goal" step (Phase 13a, v2 in 13a+). PLACEHOLDER labels (shared with the coach's
// view in @sistem/shared) until the owner sends the wording. Ids mirror the server's
// nutrition.constants.ts.
export const DIET_TYPE_OPTIONS: { id: Exclude<DietType, 'none'>; label: string }[] = (['vegetarian', 'vegan', 'pescatarian'] as const).map(
  (id) => ({ id, label: DIET_TYPE_LABELS[id] }),
);
export const DIET_STYLE_OPTIONS: { id: DietStyleId; label: string }[] = (['keto_low_carb', 'intermittent_fasting', 'other'] as const).map(
  (id) => ({ id, label: DIET_STYLE_LABELS[id] }),
);
export const RELIGIOUS_OPTIONS: { id: ReligiousId; label: string }[] = (['kosher', 'halal'] as const).map((id) => ({
  id,
  label: RELIGIOUS_LABELS[id],
}));
export const INTOLERANCE_OPTIONS: { id: IntoleranceId; label: string }[] = (
  ['lactose_free', 'gluten_free', 'celiac', 'low_fodmap', 'other'] as const
).map((id) => ({ id, label: INTOLERANCE_LABELS[id] }));
export const ALLERGY_OPTIONS: { id: AllergyId; label: string }[] = (
  ['dairy', 'eggs', 'peanuts', 'tree_nuts', 'sesame', 'soy', 'gluten', 'fish', 'shellfish', 'other'] as const
).map((id) => ({ id, label: ALLERGY_LABELS[id] }));
/** Preferred meals per day; null = no preference. */
export const MEALS_PER_DAY_OPTIONS = [2, 3, 4, 5, 6] as const;
