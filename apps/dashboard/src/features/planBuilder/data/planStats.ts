import type { DraftExercise, DraftWorkout } from '../types';
import { ESTIMATED_REST_SECONDS, ESTIMATED_SET_SECONDS } from './planDefaults';

// Numbers the builder only DISPLAYS, from the draft on screen. The server's resolvedSets stays
// the one source of what the trainee does.

export function exerciseSetCount(exercise: DraftExercise): number {
  return exercise.setTargets ? exercise.setTargets.length : (exercise.sets ?? 0);
}

export function workoutSetCount(workout: DraftWorkout): number {
  return workout.exercises.reduce((total, exercise) => total + exerciseSetCount(exercise), 0);
}

function exerciseSeconds(exercise: DraftExercise): number {
  if (exercise.setTargets) {
    return exercise.setTargets.reduce(
      (total, target) => total + (target.durationSec ?? ESTIMATED_SET_SECONDS) + (target.restSec ?? ESTIMATED_REST_SECONDS),
      0,
    );
  }
  const work = exercise.mode === 'time' ? (exercise.durationSec ?? ESTIMATED_SET_SECONDS) : ESTIMATED_SET_SECONDS;
  return exerciseSetCount(exercise) * (work + (exercise.restSec ?? ESTIMATED_REST_SECONDS));
}

/** Sets × (≈40 s of work, or the set's own seconds, + its rest), in whole minutes. An estimate. */
export function estimateWorkoutMinutes(workout: DraftWorkout): number {
  return Math.round(workout.exercises.reduce((total, exercise) => total + exerciseSeconds(exercise), 0) / 60);
}

/**
 * The big line of an exercise card, in parts: how many sets, and what one set is ("12–15", or
 * seconds). `amount` is undefined while it is not set, and for per-set targets (each set differs).
 */
export function exerciseSpec(exercise: DraftExercise): { sets: number; amount?: string; isSeconds: boolean } {
  const sets = exerciseSetCount(exercise);
  if (exercise.setTargets) return { sets, isSeconds: false };
  if (exercise.mode === 'time') return { sets, amount: exercise.durationSec?.toString(), isSeconds: true };
  if (exercise.reps === undefined) return { sets, isSeconds: false };
  return { sets, amount: exercise.repsMax !== undefined ? `${exercise.reps}–${exercise.repsMax}` : String(exercise.reps), isSeconds: false };
}
