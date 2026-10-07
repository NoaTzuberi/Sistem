import type { PersonalRecordType } from '../personalRecords/personalRecord.constants';
import { localDateString } from '../plans/planWeek';
import { computeStreak, perfectWeeks } from './streak';
import type { PlanWeek } from './streak';

/**
 * The metrics achievements are defined on (achievement.definitions.ts). Each metric is
 * a pure function from her history to a timeline of points — what the value became,
 * when, and which log / body day did it — so the same code awards live (after a save)
 * and backdates in the backfill. A new kind of data (e.g. cardio distance, pace) is a
 * new fact list in AchievementHistory plus a new metric here; the engine stays as it is.
 */

export interface CompletedLogFact {
  id: string;
  finishedAt: Date;
  planId: string;
  workoutId: string;
  /** kg */
  totalVolume: number;
  pumpPhotoAt: Date | null;
}

export interface PersonalRecordFact {
  logId: string;
  type: PersonalRecordType;
  at: Date;
}

export interface BodyDayFact {
  id: string;
  /** When the day was first saved — the best time we have for its values. */
  createdAt: Date;
  hasWeight: boolean;
  hasMeasurements: boolean;
  photoUploadedAt: Date[];
}

export interface AchievementHistory {
  timezone: string;
  /** 'YYYY-MM-DD' in her time zone */
  today: string;
  /** Completed logs only (abandoned / in progress never count), oldest first. */
  logs: CompletedLogFact[];
  personalRecords: PersonalRecordFact[];
  bodyDays: BodyDayFact[];
  /** Her published plans. */
  planWeeks: PlanWeek[];
}

/** The tunable numbers of the rules (ACHIEVEMENT_CONFIG). */
export interface AchievementRuleConfig {
  /** done / planned a week needs to count for the streak (perfect_week always needs 1). */
  streakWeekCompletionRatio: number;
  /** Calendar days (her zone) since her previous completed workout for a comeback. */
  comebackGapDays: number;
}

export interface MetricPoint {
  at: Date;
  value: number;
  sourceLogId?: string;
  sourceBodyMetricId?: string;
  /** Repeatable achievements only: makes each unlock's key unique. */
  qualifier?: string;
}

type Source = Pick<MetricPoint, 'at' | 'sourceLogId' | 'sourceBodyMetricId'>;

/** 1, 2, 3 … in time order. */
function runningCount(sources: Source[]): MetricPoint[] {
  return [...sources].sort((a, b) => a.at.getTime() - b.at.getTime()).map((source, index) => ({ ...source, value: index + 1 }));
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function personalRecordsOfType(type: PersonalRecordType | null) {
  return (history: AchievementHistory): MetricPoint[] =>
    runningCount(
      history.personalRecords
        .filter((record) => type === null || record.type === type)
        .map((record) => ({ at: record.at, sourceLogId: record.logId })),
    );
}

export const METRICS = {
  completedWorkouts: (history: AchievementHistory) =>
    runningCount(history.logs.map((log) => ({ at: log.finishedAt, sourceLogId: log.id }))),

  /** kg, lifetime. */
  totalVolume: (history: AchievementHistory) => {
    let total = 0;
    return history.logs.map((log): MetricPoint => {
      total += log.totalVolume;
      return { at: log.finishedAt, value: total, sourceLogId: log.id };
    });
  },

  personalRecords: personalRecordsOfType(null),
  weightPersonalRecords: personalRecordsOfType('weight'),
  repsPersonalRecords: personalRecordsOfType('reps'),

  /** The streak length each time a week counted. */
  streakWeeks: (history: AchievementHistory, config: AchievementRuleConfig) =>
    computeStreak(history.planWeeks, history.today, config.streakWeekCompletionRatio).points.map(
      (point): MetricPoint => ({ at: point.at, value: point.value, sourceLogId: point.logId }),
    ),

  perfectWeeks: (history: AchievementHistory) =>
    perfectWeeks(history.planWeeks).map(
      (week, index): MetricPoint => ({ at: week.at, value: index + 1, sourceLogId: week.logId, qualifier: week.weekStartDate }),
    ),

  /** A workout done at least `comebackGapDays` after the one before it (a first ever workout is no comeback). */
  comebacks: (history: AchievementHistory, config: AchievementRuleConfig) => {
    const points: MetricPoint[] = [];
    for (let index = 1; index < history.logs.length; index += 1) {
      const previous = localDateString(history.logs[index - 1].finishedAt, history.timezone);
      const log = history.logs[index];
      const gap = daysBetween(previous, localDateString(log.finishedAt, history.timezone));
      if (gap >= config.comebackGapDays) {
        points.push({ at: log.finishedAt, value: gap, sourceLogId: log.id, qualifier: log.id });
      }
    }
    return points;
  },

  pumpPhotos: (history: AchievementHistory) =>
    runningCount(history.logs.flatMap((log) => (log.pumpPhotoAt ? [{ at: log.pumpPhotoAt, sourceLogId: log.id }] : []))),

  measurementDays: (history: AchievementHistory) =>
    runningCount(
      history.bodyDays.filter((day) => day.hasMeasurements).map((day) => ({ at: day.createdAt, sourceBodyMetricId: day.id })),
    ),

  weighInDays: (history: AchievementHistory) =>
    runningCount(history.bodyDays.filter((day) => day.hasWeight).map((day) => ({ at: day.createdAt, sourceBodyMetricId: day.id }))),

  progressPhotos: (history: AchievementHistory) =>
    runningCount(history.bodyDays.flatMap((day) => day.photoUploadedAt.map((at) => ({ at, sourceBodyMetricId: day.id })))),
} satisfies Record<string, (history: AchievementHistory, config: AchievementRuleConfig) => MetricPoint[]>;

export type MetricId = keyof typeof METRICS;
