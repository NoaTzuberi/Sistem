import type { WorkoutLogSet } from '@sistem/types';
import { formatDuration } from './format';

// Read-only wording for a workout log, shared by the coach's and the trainee's screens.
// Placeholder formats — the owner decides the final ones.

/** '1 · 10 reps × 40 kg' — one performed set. */
export function describeLogSet(set: WorkoutLogSet): string {
  const amount = set.durationSec !== undefined ? formatDuration(set.durationSec) : `${set.reps ?? '—'} reps`;
  const performed = set.weight !== undefined ? `${amount} × ${set.weight} kg` : amount;
  return `${set.setIndex + 1} · ${performed}${set.completed ? '' : ' · not done'}`;
}

export interface LogExerciseGroup {
  exerciseId: string;
  sets: WorkoutLogSet[];
}

/** The sets of a log, kept in order, one group per run of the same exercise. */
export function groupLogSetsByExercise(sets: WorkoutLogSet[]): LogExerciseGroup[] {
  const groups: LogExerciseGroup[] = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.exerciseId === set.exerciseId) last.sets.push(set);
    else groups.push({ exerciseId: set.exerciseId, sets: [set] });
  }
  return groups;
}
