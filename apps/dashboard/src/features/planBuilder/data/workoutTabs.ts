/** The id of a workout's tab in the workouts row (the workout card is labelled by it). */
export function workoutTabId(workoutKey: string): string {
  return `plan-workout-tab-${workoutKey}`;
}
