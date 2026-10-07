import { Types } from 'mongoose';
import type { Achievement as PublicAchievement, AchievementOverview, AchievementType } from '@sistem/types';
import { User } from '../users/user.model';
import { DEFAULT_TIMEZONE } from '../users/users.constants';
import { WorkoutLog } from '../workoutLogs/workoutLog.model';
import { PersonalRecord } from '../personalRecords/personalRecord.model';
import type { PersonalRecordType } from '../personalRecords/personalRecord.constants';
import { BodyMetric } from '../bodyMetrics/bodyMetric.model';
import { Plan } from '../plans/plan.model';
import { localDateString, weekStartOf } from '../plans/planWeek';
import { Achievement } from './achievement.model';
import type { AchievementDocument } from './achievement.types';
import { ACHIEVEMENT_CONFIG, ACHIEVEMENT_DEFINITIONS } from './achievement.definitions';
import { resolveProgress, resolveUnlocks } from './achievementEvaluation';
import type { AchievementHistory } from './achievementMetrics';
import { computeStreak } from './streak';
import type { DoneWorkout, PlanWeek } from './streak';

// Achievements (PRD §7): evaluated on the server after each workout finish, Daily Pump
// upload and body save; never awarded twice (unique traineeId + key); never taken back.

type LeanAchievement = AchievementDocument & { _id: Types.ObjectId };

const DUPLICATE_KEY = 11000;

export function toPublicAchievement(achievement: LeanAchievement): PublicAchievement {
  return {
    id: String(achievement._id),
    traineeId: String(achievement.traineeId),
    type: achievement.type as AchievementType,
    value: achievement.value,
    unlockedAt: achievement.unlockedAt.toISOString(),
    sourceLogId: achievement.sourceLogId ? String(achievement.sourceLogId) : null,
    sourceBodyMetricId: achievement.sourceBodyMetricId ? String(achievement.sourceBodyMetricId) : null,
    seen: Boolean(achievement.seenAt),
  };
}

/** Everything the rules read, in one pass. Only her own data. */
async function loadHistory(traineeId: string, now: Date): Promise<AchievementHistory> {
  const [user, logs, records, bodyDays, plans] = await Promise.all([
    User.findById(traineeId).select('timezone').lean(),
    WorkoutLog.find({ traineeId, status: 'completed', finishedAt: { $ne: null } })
      .sort({ finishedAt: 1 })
      .select('planId workoutId finishedAt stats.totalVolume pumpPhoto.uploadedAt')
      .lean(),
    PersonalRecord.find({ userId: traineeId }).select('logId type date').lean(),
    BodyMetric.find({ traineeId }).select('weight measurements photos.uploadedAt createdAt').lean(),
    Plan.find({ traineeId, status: 'published' }).select('weekStartDate workouts._id').lean(),
  ]);
  const timezone = user?.timezone ?? DEFAULT_TIMEZONE;

  const logFacts = logs.map((log) => ({
    id: String(log._id),
    finishedAt: log.finishedAt!,
    planId: String(log.planId),
    workoutId: String(log.workoutId),
    totalVolume: log.stats?.totalVolume ?? 0,
    pumpPhotoAt: log.pumpPhoto?.uploadedAt ?? null,
  }));

  // The first completed log of each planned workout.
  const firstDone = new Map<string, DoneWorkout>();
  for (const log of logFacts) {
    const key = `${log.planId}:${log.workoutId}`;
    if (!firstDone.has(key)) firstDone.set(key, { at: log.finishedAt, logId: log.id });
  }
  const planWeeks: PlanWeek[] = plans.map((plan) => ({
    weekStartDate: plan.weekStartDate,
    planned: plan.workouts.length,
    done: plan.workouts
      .flatMap((workout) => firstDone.get(`${String(plan._id)}:${String(workout._id)}`) ?? [])
      .sort((a, b) => a.at.getTime() - b.at.getTime()),
  }));

  return {
    timezone,
    today: localDateString(now, timezone),
    logs: logFacts,
    personalRecords: records.map((record) => ({
      logId: String(record.logId),
      type: record.type as PersonalRecordType,
      at: record.date,
    })),
    bodyDays: bodyDays.map((day) => {
      // .lean() returns the measurements Map as a plain object.
      const measurements = day.measurements as unknown as Record<string, number> | undefined;
      return {
        id: String(day._id),
        createdAt: (day as { createdAt?: Date }).createdAt ?? now,
        hasWeight: day.weight !== undefined && day.weight !== null,
        hasMeasurements: Object.keys(measurements ?? {}).length > 0,
        photoUploadedAt: day.photos.map((photo) => photo.uploadedAt),
      };
    }),
    planWeeks,
  };
}

export interface EvaluateOptions {
  now?: Date;
  /**
   * Backfill (existing data): each unlock is dated to when its rule was met, and marked
   * seen so old data never triggers a celebration. Live: dated now, not seen yet.
   */
  backfill?: boolean;
}

/** Stores every achievement her history has earned that isn't stored yet; returns the new ones. */
export async function evaluateAchievements(traineeId: string, options: EvaluateOptions = {}): Promise<PublicAchievement[]> {
  const now = options.now ?? new Date();
  const unlocks = resolveUnlocks(ACHIEVEMENT_DEFINITIONS, await loadHistory(traineeId, now), ACHIEVEMENT_CONFIG);
  if (unlocks.length === 0) return [];

  const stored = new Set<string>(
    await Achievement.find({ traineeId, key: { $in: unlocks.map((unlock) => unlock.key) } }).distinct('key'),
  );
  const created: PublicAchievement[] = [];
  for (const unlock of unlocks.filter((candidate) => !stored.has(candidate.key))) {
    try {
      const achievement = await Achievement.create({
        traineeId,
        type: unlock.type,
        key: unlock.key,
        value: unlock.value,
        unlockedAt: options.backfill ? unlock.at : now,
        sourceLogId: unlock.sourceLogId ?? null,
        sourceBodyMetricId: unlock.sourceBodyMetricId ?? null,
        seenAt: options.backfill ? now : null,
      });
      created.push(toPublicAchievement(achievement.toObject() as LeanAchievement));
    } catch (error) {
      // A concurrent evaluation stored it first: it is awarded once either way.
      if ((error as { code?: number }).code !== DUPLICATE_KEY) throw error;
    }
  }
  return created;
}

/**
 * For the save paths: the save has already succeeded, so a failing evaluation is logged
 * and never fails the request — the next evaluation catches up.
 */
export async function evaluateAchievementsSafely(traineeId: string, now: Date = new Date()): Promise<PublicAchievement[]> {
  try {
    return await evaluateAchievements(traineeId, { now });
  } catch (error) {
    console.error(`[achievements] evaluation failed for ${traineeId}:`, error);
    return [];
  }
}

/** Her streak, stats, unlocked achievements and progress. Read-only (the coach reads it too). */
export async function getAchievementOverview(traineeId: string, now: Date = new Date()): Promise<AchievementOverview> {
  const [history, stored] = await Promise.all([
    loadHistory(traineeId, now),
    Achievement.find({ traineeId }).sort({ unlockedAt: -1, _id: -1 }).lean<LeanAchievement[]>(),
  ]);
  const ratio = ACHIEVEMENT_CONFIG.streakWeekCompletionRatio;
  const streak = computeStreak(history.planWeeks, history.today, ratio);
  const thisWeek = history.planWeeks.find((week) => week.weekStartDate === weekStartOf(history.today) && week.planned > 0);

  return {
    streak: {
      current: streak.current,
      best: streak.best,
      thisWeek: thisWeek ? { done: thisWeek.done.length, planned: thisWeek.planned } : null,
      weekCompletionRatio: ratio,
    },
    stats: {
      completedWorkouts: history.logs.length,
      totalVolume: history.logs.reduce((sum, log) => sum + log.totalVolume, 0),
      personalRecords: history.personalRecords.length,
    },
    unlocked: stored.map(toPublicAchievement),
    progress: resolveProgress(ACHIEVEMENT_DEFINITIONS, history, ACHIEVEMENT_CONFIG, stored),
  };
}

/** Her celebration was shown: only her own, still-unseen achievements change. */
export async function markAchievementsSeen(traineeId: string, ids: string[], now: Date = new Date()): Promise<void> {
  await Achievement.updateMany({ _id: { $in: ids }, traineeId, seenAt: null }, { $set: { seenAt: now } });
}

/** The achievements each log unlocked, keyed by log id — one query for all of them. */
export async function achievementsByLog(logIds: Types.ObjectId[]): Promise<Map<string, PublicAchievement[]>> {
  const byLog = new Map<string, PublicAchievement[]>();
  if (logIds.length === 0) return byLog;
  const docs = await Achievement.find({ sourceLogId: { $in: logIds } }).sort({ _id: 1 }).lean<LeanAchievement[]>();
  for (const doc of docs) {
    const key = String(doc.sourceLogId);
    byLog.set(key, [...(byLog.get(key) ?? []), toPublicAchievement(doc)]);
  }
  return byLog;
}
