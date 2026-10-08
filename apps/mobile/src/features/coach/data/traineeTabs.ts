// The sections of the trainee screen. Placeholder labels — the owner decides the wording.
export const TRAINEE_TABS = ['onboarding', 'plan', 'nutrition', 'tracking', 'logs', 'body', 'achievements'] as const;

export type TraineeTab = (typeof TRAINEE_TABS)[number];

export const DEFAULT_TRAINEE_TAB: TraineeTab = 'onboarding';

/** Kept in the URL (?tab=) so a reload or "back" returns to the same section. */
export const TRAINEE_TAB_PARAM = 'tab';

export const TRAINEE_TAB_LABELS: Record<TraineeTab, string> = {
  onboarding: 'Onboarding',
  plan: 'Plan',
  nutrition: 'Nutrition',
  tracking: 'Tracking',
  logs: 'Logs',
  body: 'Body',
  achievements: 'Achievements',
};

export function isTraineeTab(value: string | null): value is TraineeTab {
  return (TRAINEE_TABS as readonly string[]).includes(value ?? '');
}
