// The "Nutrition & goal" onboarding step (Phase 13a, one step with sections since 13a+). ALL
// PLACEHOLDER copy — the owner sends the final wording (Phase 15 moves it into the
// translation files). Option labels come from @sistem/shared (the coach reads the same).
export const NUTRITION_PREFERENCES_COPY = {
  title: 'Nutrition & goal',
  intro: 'Optional — helps your coach build your nutrition plan.',
  notAnswered: 'Not answered',
  none: 'None',
  // My goal
  goalTitle: 'My goal',
  currentWeight: 'Current weight',
  targetWeight: 'Target weight',
  byWhen: 'By when?',
  inWeeks: 'In weeks',
  byDate: 'By a date',
  weeks: 'Weeks',
  weeksUnit: (weeks: number) => `${weeks} week${weeks === 1 ? '' : 's'}`,
  date: 'Date',
  goalInvalid: 'Check the target weight and the weeks (1–104).',
  // How I eat
  howIEatTitle: 'How I eat',
  dietLabel: 'Diet style',
  dietNone: 'None',
  religiousLabel: 'Religious',
  mealsLabel: 'Meals per day',
  mealsNoPreference: 'No preference',
  foodsLovedLabel: 'Foods I love',
  foodsLovedPlaceholder: 'e.g. hummus, berries',
  foodsDislikedLabel: "Foods I don't like",
  foodsDislikedPlaceholder: 'e.g. mushrooms',
  // Intolerances & allergies
  restrictionsTitle: 'Intolerances & allergies',
  intolerancesLabel: 'Intolerances / medical',
  allergiesLabel: 'Allergies',
  // Details under a chosen item
  detailsLabel: (label: string) => `${label} — details`,
  detailsPlaceholder: 'Optional, e.g. "ok in yogurt"',
  otherLabel: (group: string) => `${group} — other`,
  otherPlaceholder: 'Describe it',
  otherRequired: 'Describe "other" to continue.',
  privacyNote: 'Only you and your coach see these answers.',
  reviewTitle: 'Nutrition & goal',
  skip: 'Skip',
} as const;
