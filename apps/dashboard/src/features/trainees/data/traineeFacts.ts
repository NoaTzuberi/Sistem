import type { CoachTraineeSummary, CoachTraineeWeek } from '@sistem/types';
import { isolateLtr } from '@sistem/shared';
import type { TagTone } from '../../../components/common/Tag/Tag';

const HOUR_MS = 60 * 60 * 1000;
/** Less than this left on the 48h window (or already overdue) = act now. */
const URGENT_WINDOW_HOURS = 12;

/** '3' or '3–4' training days. */
export function describeDaysPerWeek(days: NonNullable<CoachTraineeWeek['daysPerWeek']>): string {
  return days.min === days.max ? String(days.min) : isolateLtr(`${days.min}–${days.max}`);
}

/** `nowMs` is the server's clock (useServerNow), like every 48h countdown. */
export function isPlanWindowUrgent(planDueAt: string, nowMs: number): boolean {
  return new Date(planDueAt).getTime() - nowMs < URGENT_WINDOW_HOURS * HOUR_MS;
}

/** How loud a trainee's status tag is: solid pink only when the 48h window is running out. */
export function statusTagTone(trainee: CoachTraineeSummary, nowMs: number): TagTone {
  if (trainee.status === 'waiting') return trainee.planDueAt && isPlanWindowUrgent(trainee.planDueAt, nowMs) ? 'solid' : 'accent';
  return trainee.status === 'active' ? 'quiet' : 'neutral';
}
