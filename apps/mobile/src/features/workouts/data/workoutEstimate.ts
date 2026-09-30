import type { WorkoutExerciseRowValue } from '../components/WorkoutExerciseRow/WorkoutExerciseRow';

const ASSUMED_SECONDS_PER_SET = 40;
const DEFAULT_REST_SECONDS = 60;

/** Rough estimate, not a precise prediction: for each exercise, time spent is
 * sets × (time actually lifting + rest between sets). Good enough to give the
 * user a live sense of session length while building the workout. */
export function estimateWorkoutMinutes(rows: WorkoutExerciseRowValue[]): number {
  const totalSeconds = rows.reduce((sum, row) => {
    const restSeconds = row.restTime ?? DEFAULT_REST_SECONDS;
    return sum + row.defaultSets * (ASSUMED_SECONDS_PER_SET + restSeconds);
  }, 0);

  return Math.round(totalSeconds / 60);
}
