import type { LogPersonalRecord, WorkoutLog, WorkoutLogSet } from '@sistem/types';
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

/** Exercise id → name, from the facts the read endpoints attach to a log. */
export function logExerciseNames(log: WorkoutLog): Map<string, string> {
  return new Map(log.exercises?.map((exercise) => [exercise.id, exercise.name]));
}

/**
 * 'Hip thrust — 62.5 kg (was 60 kg)' · 'Push-up — 20 reps (was 15)' ·
 * 'Plank — 1 min 15s hold (was 1 min)'. Placeholder wording.
 */
export function describePersonalRecord(record: LogPersonalRecord, exerciseName = 'Exercise'): string {
  const at = record.weight !== undefined ? ` at ${record.weight} kg` : '';
  switch (record.type) {
    case 'weight':
      return `${exerciseName} — ${record.newValue} kg (was ${record.previousValue} kg)`;
    case 'reps':
      return `${exerciseName} — ${record.newValue} reps${at} (was ${record.previousValue})`;
    case 'duration':
      return `${exerciseName} — ${formatDuration(record.newValue)} hold${at} (was ${formatDuration(record.previousValue)})`;
  }
}

export function prCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'PR' : 'PRs'}`;
}
