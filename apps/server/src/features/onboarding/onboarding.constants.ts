import type { OnboardingStepId } from '@sistem/types';

// Mirrors STEP_IDS in apps/mobile/src/features/onboarding/pages/OnboardingPage.
export const ONBOARDING_STEP_IDS = [
  'welcome',
  'basic_profile',
  'goals',
  'frequency',
  'activities',
  'exercise_preferences',
  'recovery',
  'equipment',
  'review',
] as const satisfies readonly OnboardingStepId[];

export const ONBOARDING_FIELDS = [
  'name',
  'birthDate',
  'height',
  'weight',
  'gender',
  'units',
  'goals',
  'trainingFrequency',
  'preferredActivities',
  'exercisePreferences',
  'equipment',
  'recovery',
] as const;
export type OnboardingField = (typeof ONBOARDING_FIELDS)[number];

/** Which answers each step may save. 'welcome' and 'review' only record progress. */
export const ONBOARDING_STEP_FIELDS: Record<OnboardingStepId, readonly OnboardingField[]> = {
  welcome: [],
  basic_profile: ['name', 'birthDate', 'height', 'weight', 'gender', 'units'],
  goals: ['goals'],
  frequency: ['trainingFrequency'],
  activities: ['preferredActivities'],
  exercise_preferences: ['exercisePreferences'],
  recovery: ['recovery'],
  equipment: ['equipment'],
  review: [],
};

// Fields that must be present to complete onboarding (the rest are optional).
export const REQUIRED_ON_COMPLETE: readonly OnboardingField[] = [
  'birthDate',
  'height',
  'weight',
  'units',
  'goals',
  'trainingFrequency',
  'preferredActivities',
  'equipment',
];
