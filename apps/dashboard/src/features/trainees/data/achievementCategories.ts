import type { AchievementType } from '@sistem/types';
import type { IconName } from '../../../components/common/Icon/iconPaths';

// The Achievements tab groups the app's achievements (server: achievement.definitions.ts) into the
// design's categories. The design has five; the body-tracking ones have no place there, so they get
// a sixth ("tracking") — see the report.

export type AchievementCategory = 'workouts' | 'streaks' | 'perfect' | 'records' | 'volume' | 'tracking';

/** Display order of the groups. */
export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = ['workouts', 'streaks', 'perfect', 'records', 'volume', 'tracking'];

const CATEGORY_OF: Record<AchievementType, AchievementCategory> = {
  first_workout: 'workouts',
  workouts_5: 'workouts',
  workouts_10: 'workouts',
  workouts_25: 'workouts',
  workouts_50: 'workouts',
  workouts_100: 'workouts',
  // The Daily Pump is a workout's last step.
  first_pump_photo: 'workouts',
  streak_2: 'streaks',
  streak_4: 'streaks',
  streak_8: 'streaks',
  streak_12: 'streaks',
  streak_26: 'streaks',
  streak_52: 'streaks',
  comeback: 'streaks',
  perfect_week: 'perfect',
  first_weight_pr: 'records',
  first_reps_pr: 'records',
  prs_10: 'records',
  prs_25: 'records',
  prs_50: 'records',
  volume_10k: 'volume',
  volume_50k: 'volume',
  volume_100k: 'volume',
  volume_500k: 'volume',
  volume_1m: 'volume',
  first_measurement: 'tracking',
  first_progress_photo: 'tracking',
  weigh_ins_10: 'tracking',
};

export const CATEGORY_ICON: Record<AchievementCategory, IconName> = {
  workouts: 'dumbbell',
  streaks: 'flame',
  perfect: 'star',
  records: 'trophy',
  volume: 'volume',
  tracking: 'body',
};

export function achievementCategory(type: AchievementType): AchievementCategory {
  return CATEGORY_OF[type] ?? 'workouts';
}

/** The global class that sets --ach-color / --ach-light for a category (styles/globals.css). */
export function achievementCategoryClass(category: AchievementCategory): string {
  return `ach-category-${category}`;
}
