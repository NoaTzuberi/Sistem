import { addDays, weekStartOf } from '../plans/planWeek';

/**
 * The weekly plan completion streak (PRD §7, owner decisions Phase 11). Pure functions
 * over plan weeks — 'YYYY-MM-DD' Sundays in the trainee's time zone — and `today` in
 * that same zone, so nothing here reads a clock.
 *
 * - A week COUNTS when done / planned reaches the completion ratio (config, default 1).
 * - A week BREAKS the streak when it has ended without counting.
 * - Weeks without a published plan (or with no workouts) are neutral: skipped.
 * - The week in progress never breaks it — she can still finish it.
 */

const LAST_DAY_OFFSET = 6;
// ratio × planned can land a hair above a whole number (0.7 × 10).
const RATIO_EPSILON = 1e-9;

/** When a workout of the week was first done. */
export interface DoneWorkout {
  at: Date;
  logId: string;
}

export interface PlanWeek {
  weekStartDate: string;
  planned: number;
  /** One entry per done workout (its first completed log), oldest first. */
  done: DoneWorkout[];
}

export interface StreakPoint extends DoneWorkout {
  weekStartDate: string;
  /** The streak length once this week counted. */
  value: number;
}

export interface StreakResult {
  current: number;
  best: number;
  /** One point per counting week, in week order. */
  points: StreakPoint[];
}

/** Workouts a week needs for `ratio` (at least one). */
export function workoutsNeeded(planned: number, ratio: number): number {
  return Math.max(1, Math.ceil(ratio * planned - RATIO_EPSILON));
}

/** The done workout that made the week reach `ratio`, or null if it hasn't. */
export function weekReachedAt(week: PlanWeek, ratio: number): DoneWorkout | null {
  if (week.planned === 0) return null;
  return week.done[workoutsNeeded(week.planned, ratio) - 1] ?? null;
}

export function hasWeekEnded(weekStartDate: string, today: string): boolean {
  return addDays(weekStartDate, LAST_DAY_OFFSET) < today;
}

/** `weeks` in any order; weeks after the current one are ignored. */
export function computeStreak(weeks: PlanWeek[], today: string, ratio: number): StreakResult {
  const thisWeek = weekStartOf(today);
  const ordered = weeks
    .filter((week) => week.planned > 0 && week.weekStartDate <= thisWeek)
    .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

  let run = 0;
  let best = 0;
  const points: StreakPoint[] = [];
  for (const week of ordered) {
    const reached = weekReachedAt(week, ratio);
    if (reached) {
      run += 1;
      best = Math.max(best, run);
      points.push({ ...reached, weekStartDate: week.weekStartDate, value: run });
    } else if (hasWeekEnded(week.weekStartDate, today)) {
      run = 0;
    }
  }
  return { current: run, best, points };
}

/** Weeks where every planned workout is done (perfect_week is always 100%). */
export function perfectWeeks(weeks: PlanWeek[]): (DoneWorkout & { weekStartDate: string })[] {
  return weeks.flatMap((week) => {
    const reached = weekReachedAt(week, 1);
    return reached ? [{ ...reached, weekStartDate: week.weekStartDate }] : [];
  });
}
