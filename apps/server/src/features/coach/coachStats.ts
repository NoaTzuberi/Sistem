import type {
  CoachBoardCell,
  CoachStats,
  CoachStatsRange,
  CoachTraineeWeek,
  CoachWeekPlan,
  PlanStatus,
  TraineeStatus,
} from '@sistem/types';
import { addDays, daysBetween, localDateString, weekStartOf } from '../plans/planWeek';
import { resolveWorkoutStatus } from '../plans/planStatus';

/**
 * The coach's statistics and overview numbers (GET /coach/stats) — pure: the service loads her
 * trainees, their plans and completed logs, and everything here is computed from them.
 *
 * Dates are 'YYYY-MM-DD' strings and months 'YYYY-MM' (they compare as plain strings). A
 * trainee's week and "today" are in HER zone; months and the 8-week row are in the coach's.
 */

export const STATS_RANGES: readonly CoachStatsRange[] = [3, 6, 12];
export const DEFAULT_STATS_RANGE: CoachStatsRange = 6;
const WEEKS_SHOWN = 8;
const BOARD_DAYS = 7;
const RETENTION_MONTHS = [1, 3, 6] as const;
const RECENT_PR_DAYS = 7;
const LAST_DAY_OFFSET = 6;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Anything but 3 / 6 / 12 reads as the default — the page always gets an answer. */
export function parseStatsRange(value: unknown): CoachStatsRange {
  const range = STATS_RANGES.find((option) => String(option) === value);
  return range ?? DEFAULT_STATS_RANGE;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, count: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + count, 1));
  return shifted.toISOString().slice(0, 7);
}

export function lastDayOfMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  // Day 0 of the next month = the last day of this one.
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

/** The same day `count` months away; a day the month does not have becomes its last day (31 Jan → 28 Feb). */
export function addMonthsToDate(date: string, count: number): string {
  const month = addMonths(monthOf(date), count);
  const lastDay = lastDayOfMonth(month);
  const sameDay = `${month}-${date.slice(8)}`;
  return sameDay > lastDay ? lastDay : sameDay;
}

export interface StatsTrainee {
  id: string;
  timezone: string;
  createdAt: Date;
  onboardingCompletedAt: Date | null;
  status: TraineeStatus;
  goals: string[];
  daysPerWeek: { min: number; max: number } | null;
}

export interface StatsPlan {
  id: string;
  traineeId: string;
  weekStartDate: string;
  status: PlanStatus;
  publishedAt: Date | null;
  splitId: string | null;
  workouts: { id: string; dayOfWeek?: number }[];
}

/** A COMPLETED workout log. */
export interface StatsLog {
  id: string;
  traineeId: string;
  planId: string;
  workoutId: string;
  finishedAt: Date;
  rating?: number;
  prCount: number;
}

interface StatsInput {
  trainees: StatsTrainee[];
  plans: StatsPlan[];
  logs: StatsLog[];
  coachTimezone: string;
  range: CoachStatsRange;
  now: Date;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(mean * 10) / 10;
}

export function buildCoachStats({ trainees, plans, logs, coachTimezone, range, now }: StatsInput): Omit<CoachStats, 'pump'> {
  const today = localDateString(now, coachTimezone);
  const weekStartDate = weekStartOf(today);
  const thisMonth = monthOf(today);
  const rangeStart = addMonthsToDate(today, -range);

  const doneWorkouts = new Set(logs.map((log) => `${log.planId}:${log.workoutId}`));
  const isDone = (plan: StatsPlan, workoutId: string) => doneWorkouts.has(`${plan.id}:${workoutId}`);
  const countDone = (plan: StatsPlan) => plan.workouts.filter((workout) => isDone(plan, workout.id)).length;

  const published = plans.filter((plan) => plan.status === 'published');
  const plansByTrainee = groupBy(plans, (plan) => plan.traineeId);
  const publishedByTrainee = groupBy(published, (plan) => plan.traineeId);
  const logsByTrainee = groupBy(logs, (log) => log.traineeId);

  // --- Each trainee's week (her zone) ------------------------------------------------------
  const traineeWeeks = trainees.map((trainee): CoachTraineeWeek => {
    const traineeToday = localDateString(now, trainee.timezone);
    const traineeWeek = weekStartOf(traineeToday);
    const herPublished = publishedByTrainee.get(trainee.id) ?? [];
    const current = herPublished.find((plan) => plan.weekStartDate === traineeWeek);
    const next = (plansByTrainee.get(trainee.id) ?? []).find((plan) => plan.weekStartDate === addDays(traineeWeek, 7));

    const currentPlan: CoachWeekPlan | null = current
      ? {
          id: current.id,
          weekStartDate: current.weekStartDate,
          splitId: current.splitId,
          workouts: current.workouts.map((workout) => ({
            id: workout.id,
            status: resolveWorkoutStatus(
              workout.dayOfWeek === undefined ? null : addDays(current.weekStartDate, workout.dayOfWeek),
              current.weekStartDate,
              traineeToday,
              isDone(current, workout.id),
            ),
          })),
          planned: current.workouts.length,
          completed: countDone(current),
          daysLeft: daysBetween(traineeToday, addDays(traineeWeek, LAST_DAY_OFFSET)),
        }
      : null;

    const finishedDates = new Set((logsByTrainee.get(trainee.id) ?? []).map((log) => localDateString(log.finishedAt, trainee.timezone)));
    // The open workouts that have a day: a passed day is a miss, today's is still planned.
    const openDates = new Set(
      herPublished.flatMap((plan) =>
        plan.workouts
          .filter((workout) => workout.dayOfWeek !== undefined && !isDone(plan, workout.id))
          .map((workout) => addDays(plan.weekStartDate, workout.dayOfWeek!)),
      ),
    );
    const days = Array.from({ length: BOARD_DAYS }, (_, index) => {
      const date = addDays(traineeToday, index - (BOARD_DAYS - 1));
      let cell: CoachBoardCell | null = null;
      if (finishedDates.has(date)) cell = 'done';
      else if (openDates.has(date)) cell = date < traineeToday ? 'missed' : 'planned';
      return { date, cell };
    });

    return {
      traineeId: trainee.id,
      goals: trainee.goals,
      daysPerWeek: trainee.daysPerWeek,
      currentPlan,
      nextWeekPlan: next ? { id: next.id, status: next.status } : null,
      days,
    };
  });

  // --- Workouts: this week, the last 8 weeks, the range ------------------------------------
  const thisWeek = traineeWeeks.reduce(
    (total, week) => ({
      planned: total.planned + (week.currentPlan?.planned ?? 0),
      completed: total.completed + (week.currentPlan?.completed ?? 0),
    }),
    { planned: 0, completed: 0 },
  );

  const publishedByWeek = groupBy(published, (plan) => plan.weekStartDate);
  const weeklyWorkouts = Array.from({ length: WEEKS_SHOWN }, (_, index) => {
    const week = addDays(weekStartDate, (index - (WEEKS_SHOWN - 1)) * 7);
    const weekPlans = publishedByWeek.get(week) ?? [];
    return {
      weekStartDate: week,
      planned: weekPlans.reduce((sum, plan) => sum + plan.workouts.length, 0),
      completed: weekPlans.reduce((sum, plan) => sum + countDone(plan), 0),
    };
  });

  // Only weeks that have ended: a week in progress would pull the rate down for no reason.
  const firstRangeWeek = weekStartOf(rangeStart);
  const traineeWeekStart = new Map(trainees.map((trainee) => [trainee.id, weekStartOf(localDateString(now, trainee.timezone))]));
  const endedPlans = published.filter((plan) => {
    const currentWeek = traineeWeekStart.get(plan.traineeId);
    return currentWeek !== undefined && plan.weekStartDate >= firstRangeWeek && plan.weekStartDate < currentWeek;
  });

  // --- Trainees over time ------------------------------------------------------------------
  const activeNow = trainees.filter((trainee) => trainee.status === 'active').length;
  /** A past date: who had a published plan for that week or the one after it. */
  const activeAt = (date: string): number => {
    const week = weekStartOf(date);
    const nextWeek = addDays(week, 7);
    return trainees.filter((trainee) =>
      (publishedByTrainee.get(trainee.id) ?? []).some((plan) => plan.weekStartDate === week || plan.weekStartDate === nextWeek),
    ).length;
  };
  const activeByMonth = Array.from({ length: range }, (_, index) => {
    const month = addMonths(thisMonth, index - (range - 1));
    return { month, active: month === thisMonth ? activeNow : activeAt(lastDayOfMonth(month)) };
  });

  const lastMonth = addMonths(thisMonth, -1);
  const signUpMonths = trainees.map((trainee) => monthOf(localDateString(trainee.createdAt, coachTimezone)));
  const newThisMonth = signUpMonths.filter((month) => month === thisMonth).length;
  const newLastMonth = signUpMonths.filter((month) => month === lastMonth).length;

  // --- Onboarding → first published plan ---------------------------------------------------
  const hoursToFirstPlan: number[] = [];
  for (const trainee of trainees) {
    const completedAt = trainee.onboardingCompletedAt;
    if (!completedAt || localDateString(completedAt, coachTimezone) < rangeStart) continue;
    const publishTimes = (publishedByTrainee.get(trainee.id) ?? []).flatMap((plan) => (plan.publishedAt ? [plan.publishedAt.getTime()] : []));
    if (publishTimes.length === 0) continue;
    const waitedMs = Math.min(...publishTimes) - completedAt.getTime();
    // A plan published before she finished onboarding (seed data, a re-done questionnaire) says nothing about the wait.
    if (waitedMs >= 0) hoursToFirstPlan.push(waitedMs / HOUR_MS);
  }

  const ratings = logs.flatMap((log) =>
    log.rating !== undefined && localDateString(log.finishedAt, coachTimezone) >= rangeStart ? [log.rating] : [],
  );

  // --- Goals and retention -----------------------------------------------------------------
  const goalCounts = new Map<string, number>();
  for (const trainee of trainees) {
    if (trainee.status !== 'active') continue;
    for (const goalId of trainee.goals) goalCounts.set(goalId, (goalCounts.get(goalId) ?? 0) + 1);
  }
  const goals = [...goalCounts].map(([goalId, count]) => ({ goalId, count })).sort((a, b) => b.count - a.count);

  const retention = RETENTION_MONTHS.map((months) => {
    let eligible = 0;
    let retained = 0;
    for (const trainee of trainees) {
      if (!trainee.onboardingCompletedAt) continue;
      const target = addMonthsToDate(localDateString(trainee.onboardingCompletedAt, trainee.timezone), months);
      if (target > localDateString(now, trainee.timezone)) continue;
      eligible += 1;
      const targetWeek = weekStartOf(target);
      if ((publishedByTrainee.get(trainee.id) ?? []).some((plan) => plan.weekStartDate >= targetWeek)) retained += 1;
    }
    return { months, eligible, retained };
  });

  const recentSince = now.getTime() - RECENT_PR_DAYS * DAY_MS;
  const recentPrs = logs
    .filter((log) => log.prCount > 0 && log.finishedAt.getTime() >= recentSince)
    .map((log) => ({ logId: log.id, prCount: log.prCount }));

  return {
    range,
    serverTime: now.toISOString(),
    today,
    weekStartDate,
    summary: {
      activeTrainees: activeNow,
      activeTraineesChange: activeNow - activeAt(lastDayOfMonth(lastMonth)),
      newTraineesThisMonth: newThisMonth,
      newTraineesChange: newThisMonth - newLastMonth,
      completedWorkouts: endedPlans.reduce((sum, plan) => sum + countDone(plan), 0),
      plannedWorkouts: endedPlans.reduce((sum, plan) => sum + plan.workouts.length, 0),
      hoursToFirstPlan: average(hoursToFirstPlan),
      firstPlanCount: hoursToFirstPlan.length,
      averageRating: average(ratings),
      ratingCount: ratings.length,
    },
    thisWeek,
    activeByMonth,
    weeklyWorkouts,
    goals,
    retention,
    trainees: traineeWeeks,
    recentPrs,
  };
}
