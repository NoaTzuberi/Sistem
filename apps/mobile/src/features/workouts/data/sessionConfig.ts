// Tuning of the active workout session (Phase 8). Units: kg, seconds, milliseconds.

/** Weight step of the −/+ buttons, by the exercise's equipment (owner decision). */
const WEIGHT_STEP_BY_EQUIPMENT: Record<string, number> = {
  dumbbell: 1,
  kettlebell: 1,
};
const DEFAULT_WEIGHT_STEP_KG = 2.5;

/** The first of the exercise's equipment that has a rule decides; otherwise 2.5 kg. */
export function weightStepFor(equipment: string[] | undefined): number {
  const match = equipment?.find((id) => WEIGHT_STEP_BY_EQUIPMENT[id] !== undefined);
  return match ? WEIGHT_STEP_BY_EQUIPMENT[match] : DEFAULT_WEIGHT_STEP_KG;
}

export const REPS_STEP = 1;
export const DURATION_STEP_SEC = 5;
export const REST_ADJUST_SEC = 15;

export const MAX_REPS = 1000;
export const MAX_WEIGHT_KG = 1000;
export const MAX_DURATION_SEC = 6 * 60 * 60;

/** Set changes are batched for this long before they are sent. */
export const SYNC_DEBOUNCE_MS = 800;
/** Unsent changes are retried this often while offline (also on reconnect / foreground). */
export const SYNC_RETRY_MS = 5000;

/** A rest that ended longer ago than this (app in the background) ends without its beep. */
export const REST_LATE_BEEP_MS = 2000;

/** How long "Rest over" stays on screen before the bar hides. */
export const REST_OVER_NOTICE_MS = 4000;

export const VIBRATE_SET_DONE_MS = [200, 100, 200];

// The free interval timer: defaults (a classic Tabata is 20 s / 10 s × 8) and limits.
export const FREE_TIMER_DEFAULTS = { workSec: 20, restSec: 10, rounds: 8 };
export const FREE_TIMER_STEP_SEC = 5;
export const FREE_TIMER_MIN_WORK_SEC = 5;
export const FREE_TIMER_MAX_SEC = 10 * 60;
export const FREE_TIMER_MAX_ROUNDS = 50;
