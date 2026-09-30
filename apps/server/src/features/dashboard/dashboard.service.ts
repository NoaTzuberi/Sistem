import { Workout } from '../workouts/workout.model';
import { listPersonalRecords } from '../personalRecords/personalRecord.service';
import type { PublicPersonalRecord } from '../personalRecords/personalRecord.service';
import { listProgressEntries } from '../progress/progress.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_PR_LIMIT = 5;
const WEIGHT_TREND_LIMIT = 30;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Current streak = consecutive calendar days (UTC) with at least one
 * completed workout, walking back from today. If neither today nor
 * yesterday has a completed workout, the streak is broken (0) — a day
 * logged the day before yesterday doesn't keep a "current" streak alive.
 */
function computeStreak(workoutDates: Date[]): number {
  const daySet = new Set(workoutDates.map(toDateKey));

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  if (!daySet.has(toDateKey(cursor))) {
    cursor.setTime(cursor.getTime() - MS_PER_DAY);
    if (!daySet.has(toDateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (daySet.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - MS_PER_DAY);
  }
  return streak;
}

export interface WeightTrendPoint {
  date: Date;
  weight: number;
}

export interface DashboardSummary {
  streak: number;
  totalWorkouts: number;
  workoutsLast7Days: number;
  recentPersonalRecords: PublicPersonalRecord[];
  weightTrend: WeightTrendPoint[];
  latestWeight?: number;
  weightChange?: number;
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

  const [completedWorkoutDates, totalWorkouts, workoutsLast7Days, recentPersonalRecords, progressEntries] =
    await Promise.all([
      Workout.find({ userId, status: 'completed' }).select('date').lean(),
      Workout.countDocuments({ userId, status: 'completed' }),
      Workout.countDocuments({ userId, status: 'completed', date: { $gte: sevenDaysAgo } }),
      listPersonalRecords(userId, RECENT_PR_LIMIT),
      listProgressEntries(userId, WEIGHT_TREND_LIMIT),
    ]);

  const streak = computeStreak(completedWorkoutDates.map((d) => d.date));

  const weightTrend = progressEntries
    .filter((entry) => entry.weight !== undefined)
    .map((entry) => ({ date: entry.date, weight: entry.weight! }))
    .reverse();

  const latestWeight = weightTrend.length > 0 ? weightTrend[weightTrend.length - 1].weight : undefined;
  const weightChange =
    weightTrend.length > 1 ? weightTrend[weightTrend.length - 1].weight - weightTrend[0].weight : undefined;

  return {
    streak,
    totalWorkouts,
    workoutsLast7Days,
    recentPersonalRecords,
    weightTrend,
    latestWeight,
    weightChange,
  };
}
