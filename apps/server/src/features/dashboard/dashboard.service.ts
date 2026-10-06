import { WorkoutLog } from '../workoutLogs/workoutLog.model';
import { listPersonalRecords } from '../personalRecords/personalRecord.service';
import type { PublicPersonalRecord } from '../personalRecords/personalRecord.service';
import { BodyMetric } from '../bodyMetrics/bodyMetric.model';

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
  /** 'YYYY-MM-DD' in her time zone (BodyMetric). */
  date: string;
  /** kg */
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

  const [completedWorkoutDates, totalWorkouts, workoutsLast7Days, recentPersonalRecords, weighIns] =
    await Promise.all([
      // Completed workout logs since Phase 8 (the ATLAS Workout collection is gone).
      WorkoutLog.find({ traineeId: userId, status: 'completed' }).select('finishedAt').lean(),
      WorkoutLog.countDocuments({ traineeId: userId, status: 'completed' }),
      WorkoutLog.countDocuments({ traineeId: userId, status: 'completed', finishedAt: { $gte: sevenDaysAgo } }),
      listPersonalRecords(userId, RECENT_PR_LIMIT),
      // Her latest weigh-ins (Phase 10 body tracking; the ATLAS Progress API is gone).
      BodyMetric.find({ traineeId: userId, weight: { $exists: true } })
        .sort({ date: -1 })
        .limit(WEIGHT_TREND_LIMIT)
        .select('date weight')
        .lean(),
    ]);

  const streak = computeStreak(completedWorkoutDates.flatMap((log) => (log.finishedAt ? [log.finishedAt] : [])));

  const weightTrend = weighIns.map((entry) => ({ date: entry.date, weight: entry.weight! })).reverse();

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
