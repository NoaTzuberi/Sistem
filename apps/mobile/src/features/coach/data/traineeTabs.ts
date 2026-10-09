// The sections of the trainee screen. Their labels are in the shared copy (coach.tabs).
export const TRAINEE_TABS = ['onboarding', 'plan', 'nutrition', 'tracking', 'logs', 'body', 'achievements'] as const;

export type TraineeTab = (typeof TRAINEE_TABS)[number];

export const DEFAULT_TRAINEE_TAB: TraineeTab = 'onboarding';

/** Kept in the URL (?tab=) so a reload or "back" returns to the same section. */
export const TRAINEE_TAB_PARAM = 'tab';


export function isTraineeTab(value: string | null): value is TraineeTab {
  return (TRAINEE_TABS as readonly string[]).includes(value ?? '');
}
