import type { PlanSetTarget, ResolvedPlanSet, SetType } from '@sistem/types';
import { addDaysToDate, formatDuration } from './format';

// Read-only wording for a plan, shared by the coach's and the trainee's screens. Placeholder formats — the owner decides the final ones.

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Placeholder wording for the weeks the server marks 'this' / 'next' (PlanWeekRelation). */
export const WEEK_RELATION_LABELS = { this: 'This week', next: 'Next week' } as const;

/**
 * 'This week' / 'Next week' for a plan, against the trainee's current week as the server
 * sent it (CoachTraineeSummary.currentWeekStart); null for any other week.
 */
export function weekRelationLabel(weekStartDate: string, currentWeekStart: string): string | null {
  if (weekStartDate === currentWeekStart) return WEEK_RELATION_LABELS.this;
  if (weekStartDate === addDaysToDate(currentWeekStart, 7)) return WEEK_RELATION_LABELS.next;
  return null;
}

const SET_TYPE_LABELS: Record<SetType, string> = { warmup: 'Warm-up', working: 'Working', drop: 'Drop' };

/** '8–10', '12' or '30s' — what one set asks for, without the unit word. */
function formatAmount(set: PlanSetTarget): string {
  if (set.durationSec !== undefined) return formatDuration(set.durationSec);
  if (set.reps === undefined) return '—';
  return set.repsMax !== undefined ? `${set.reps}–${set.repsMax}` : `${set.reps}`;
}

function formatExtras(set: PlanSetTarget): string[] {
  return [
    ...(set.targetWeight !== undefined ? [`${set.targetWeight} kg`] : []),
    ...(set.restSec ? [`rest ${formatDuration(set.restSec)}`] : []),
  ];
}

function isSameTarget(a: ResolvedPlanSet, b: ResolvedPlanSet): boolean {
  return (
    a.type === b.type &&
    a.reps === b.reps &&
    a.repsMax === b.repsMax &&
    a.durationSec === b.durationSec &&
    a.targetWeight === b.targetWeight &&
    a.restSec === b.restSec
  );
}

/**
 * The targets of one exercise, from the server's resolvedSets (sets are never derived
 * here): one line when every set is the same ('3 × 8–10 · 40 kg · rest 1 min 30s'),
 * otherwise one line per set ('1 · Warm-up · 10 · 20 kg').
 */
export function describeTargets(sets: ResolvedPlanSet[]): string[] {
  if (sets.length === 0) return [];

  const first = sets[0];
  if (first.type === 'working' && sets.every((set) => isSameTarget(set, first))) {
    return [[`${sets.length} × ${formatAmount(first)}`, ...formatExtras(first)].join(' · ')];
  }

  return sets.map((set) =>
    [`${set.setIndex + 1}`, SET_TYPE_LABELS[set.type], formatAmount(set), ...formatExtras(set)].join(' · '),
  );
}
