/** How many identity colors there are (--color-workout-1 … -5 in the tokens). */
const WORKOUT_COLOR_COUNT = 5;

/**
 * The class that gives a workout its identity color (--workout-color / --workout-color-soft,
 * defined in PlanEditor.css): by its place in the plan, cycling. Visual only — never stored.
 */
export function workoutColorClass(index: number): string {
  return `workout-color-${(index % WORKOUT_COLOR_COUNT) + 1}`;
}
