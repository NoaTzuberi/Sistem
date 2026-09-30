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
