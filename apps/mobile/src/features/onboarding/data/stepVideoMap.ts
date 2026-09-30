export type OnboardingStepId =
  | 'welcome'
  | 'basic_profile'
  | 'goals'
  | 'frequency'
  | 'activities'
  | 'exercise_preferences'
  | 'recovery'
  | 'equipment'
  | 'review';

/**
 * Maps an onboarding step to its background video source.
 * The available footage (see activityVideoMap.ts) is activity-specific,
 * with nothing generic enough for these wizard steps, so every entry is
 * left unset and StepVideoBackground falls back to a neutral placeholder.
 * To connect a real video later, add `welcome: '<path-or-url>'` etc. —
 * no changes to the onboarding UI are needed.
 */
export const STEP_VIDEO_MAP: Partial<Record<OnboardingStepId, string>> = {};
