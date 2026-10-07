import type { AchievementType } from '@sistem/types';
import type { AchievementRuleConfig, MetricId } from './achievementMetrics';

/**
 * THE achievement config (PRD §7). Every achievement is one line: a metric
 * (achievementMetrics.ts) and either a threshold (one-time, key = type) or
 * `repeatable` (one unlock per metric point, key = type:<qualifier>). The order here is
 * the order of the trainee's achievements list. Names live in the clients
 * (@sistem/shared describeAchievement).
 *
 * Never based on body weight gain or loss (PRD §7): trainees have different goals.
 */

export const ACHIEVEMENT_CONFIG: AchievementRuleConfig = {
  // 1 = every planned workout of the week. Only the streak uses it; perfect_week is always 100%.
  streakWeekCompletionRatio: 1,
  // 14 = e.g. her last workout on 1 Oct, the comeback on 15 Oct or later (her time zone).
  comebackGapDays: 14,
};

export type AchievementDefinition =
  | { type: AchievementType; metric: MetricId; threshold: number; repeatable?: false }
  | { type: AchievementType; metric: MetricId; repeatable: true };

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  { type: 'first_workout', metric: 'completedWorkouts', threshold: 1 },
  { type: 'workouts_5', metric: 'completedWorkouts', threshold: 5 },
  { type: 'workouts_10', metric: 'completedWorkouts', threshold: 10 },
  { type: 'workouts_25', metric: 'completedWorkouts', threshold: 25 },
  { type: 'workouts_50', metric: 'completedWorkouts', threshold: 50 },
  { type: 'workouts_100', metric: 'completedWorkouts', threshold: 100 },

  { type: 'perfect_week', metric: 'perfectWeeks', repeatable: true },
  { type: 'streak_2', metric: 'streakWeeks', threshold: 2 },
  { type: 'streak_4', metric: 'streakWeeks', threshold: 4 },
  { type: 'streak_8', metric: 'streakWeeks', threshold: 8 },
  { type: 'streak_12', metric: 'streakWeeks', threshold: 12 },
  { type: 'streak_26', metric: 'streakWeeks', threshold: 26 },
  { type: 'streak_52', metric: 'streakWeeks', threshold: 52 },
  { type: 'comeback', metric: 'comebacks', repeatable: true },

  { type: 'first_weight_pr', metric: 'weightPersonalRecords', threshold: 1 },
  { type: 'first_reps_pr', metric: 'repsPersonalRecords', threshold: 1 },
  { type: 'prs_10', metric: 'personalRecords', threshold: 10 },
  { type: 'prs_25', metric: 'personalRecords', threshold: 25 },
  { type: 'prs_50', metric: 'personalRecords', threshold: 50 },

  // kg, lifetime total volume
  { type: 'volume_10k', metric: 'totalVolume', threshold: 10_000 },
  { type: 'volume_50k', metric: 'totalVolume', threshold: 50_000 },
  { type: 'volume_100k', metric: 'totalVolume', threshold: 100_000 },
  { type: 'volume_500k', metric: 'totalVolume', threshold: 500_000 },
  { type: 'volume_1m', metric: 'totalVolume', threshold: 1_000_000 },

  { type: 'first_pump_photo', metric: 'pumpPhotos', threshold: 1 },
  { type: 'first_measurement', metric: 'measurementDays', threshold: 1 },
  { type: 'first_progress_photo', metric: 'progressPhotos', threshold: 1 },
  { type: 'weigh_ins_10', metric: 'weighInDays', threshold: 10 },
];
