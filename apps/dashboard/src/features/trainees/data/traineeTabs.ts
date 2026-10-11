import type { sharedCopy } from '@sistem/shared';
import type { TraineeTab } from '../../../app/config/routes';
import type { traineesCopy } from '../copy';

/** The name of a trainee section — the same on her page's tabs and in the quick-view drawer. */
export function traineeTabLabel(tab: TraineeTab, copy: (typeof traineesCopy)['he'], shared: (typeof sharedCopy)['he']): string {
  if (tab === 'logs') return copy.workoutLogs;
  if (tab === 'metrics') return shared.coach.tabs.body;
  return shared.coach.tabs[tab];
}

/** The drawer's order: what she works on first (the trainee page keeps its own order). */
export const DRAWER_TABS: readonly TraineeTab[] = ['plans', 'logs', 'metrics', 'nutrition', 'onboarding', 'achievements'];
