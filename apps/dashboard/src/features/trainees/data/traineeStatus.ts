import type { CoachTraineeSummary, TraineeStatus } from '@sistem/types';
import type { BadgeTone } from '../../../components/common/Badge/Badge';

// Placeholder labels — the owner decides the final wording.
export const TRAINEE_STATUS_LABELS: Record<TraineeStatus, string> = {
  new: 'New',
  waiting: 'Waiting for plan',
  active: 'Active',
  inactive: 'Inactive',
};

export const TRAINEE_STATUS_TONES: Record<TraineeStatus, BadgeTone> = {
  new: 'neutral',
  waiting: 'solid',
  active: 'accent',
  inactive: 'neutral',
};

export const NEEDS_NEXT_WEEK_LABEL = "Needs next week's plan";

export type TraineeFilter = 'all' | 'needs_next_week' | TraineeStatus;

export const STATUS_FILTERS: { id: Exclude<TraineeFilter, 'needs_next_week'>; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: TRAINEE_STATUS_LABELS.new },
  { id: 'waiting', label: TRAINEE_STATUS_LABELS.waiting },
  { id: 'active', label: TRAINEE_STATUS_LABELS.active },
  { id: 'inactive', label: TRAINEE_STATUS_LABELS.inactive },
];

export function matchesFilter(trainee: CoachTraineeSummary, filter: TraineeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'needs_next_week') return trainee.needsNextWeekPlan;
  return trainee.status === filter;
}

function urgency(trainee: CoachTraineeSummary): number {
  if (trainee.status === 'waiting') return 0;
  if (trainee.needsNextWeekPlan) return 1;
  return 2;
}

/**
 * What needs the coach first: trainees waiting for their first plan (least time left
 * on top), then the ones without a plan for next week, then everyone else as the
 * server sent them (newest sign-up first).
 */
export function sortByUrgency(trainees: CoachTraineeSummary[]): CoachTraineeSummary[] {
  return [...trainees].sort((a, b) => {
    const byUrgency = urgency(a) - urgency(b);
    if (byUrgency !== 0) return byUrgency;
    if (a.planDueAt && b.planDueAt) return a.planDueAt.localeCompare(b.planDueAt);
    return 0;
  });
}
