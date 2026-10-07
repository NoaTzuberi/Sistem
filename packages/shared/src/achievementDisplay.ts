import type { AchievementProgress, AchievementType, StreakSummary } from '@sistem/types';

// Names and descriptions of the achievements (Phase 11). The server stores only the
// type; both apps build the text here. PLACEHOLDER wording — the owner sends the final copy.

export interface AchievementText {
  name: string;
  description: string;
}

const workouts = (count: number): AchievementText => ({
  name: `${count} workouts`,
  description: `Complete ${count} workouts.`,
});
const prs = (count: number): AchievementText => ({
  name: `${count} PRs`,
  description: `Set ${count} personal records.`,
});
const volume = (label: string): AchievementText => ({
  name: `${label} kg lifted`,
  description: `Lift ${label} kg in total, over all your workouts.`,
});
const streak = (weeks: number): AchievementText => ({
  name: `${weeks}-week streak`,
  description: `Complete your weekly plan ${weeks} weeks in a row.`,
});

const ACHIEVEMENT_TEXT: Record<AchievementType, AchievementText> = {
  first_workout: { name: 'First workout', description: 'Complete your first workout.' },
  workouts_5: workouts(5),
  workouts_10: workouts(10),
  workouts_25: workouts(25),
  workouts_50: workouts(50),
  workouts_100: workouts(100),
  first_weight_pr: { name: 'Heavier than ever', description: 'Lift your heaviest weight on an exercise.' },
  first_reps_pr: { name: 'Rep record', description: 'Do more reps than ever at a weight you have lifted before.' },
  prs_10: prs(10),
  prs_25: prs(25),
  prs_50: prs(50),
  volume_10k: volume('10,000'),
  volume_50k: volume('50,000'),
  volume_100k: volume('100,000'),
  volume_500k: volume('500,000'),
  volume_1m: volume('1,000,000'),
  perfect_week: { name: 'Perfect week', description: 'Complete every workout of your weekly plan.' },
  streak_2: streak(2),
  streak_4: streak(4),
  streak_8: streak(8),
  streak_12: streak(12),
  streak_26: streak(26),
  streak_52: streak(52),
  comeback: { name: 'Comeback', description: 'Train again after 14 days or more away.' },
  first_pump_photo: { name: 'First Daily Pump', description: 'Add your first Daily Pump photo.' },
  first_measurement: { name: 'First measurements', description: 'Log your body measurements for the first time.' },
  first_progress_photo: { name: 'First progress photo', description: 'Add your first progress photo.' },
  weigh_ins_10: { name: '10 weigh-ins', description: 'Log your weight on 10 days.' },
};

export function describeAchievement(type: AchievementType): AchievementText {
  return ACHIEVEMENT_TEXT[type] ?? { name: type, description: '' };
}

const unlockedDateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** '7 Oct 2026' — when an achievement was unlocked, in the viewer's zone. */
export function formatUnlockedDate(iso: string): string {
  return unlockedDateFormat.format(new Date(iso));
}

/** '3 weeks' / '1 week'. */
export function streakWeeksLabel(weeks: number): string {
  return `${weeks} week${weeks === 1 ? '' : 's'}`;
}

/** This week's progress: '2 / 3 workouts', or null without a plan. */
export function streakWeekLabel(streak: StreakSummary): string | null {
  return streak.thisWeek ? `${streak.thisWeek.done} / ${streak.thisWeek.planned} workouts this week` : null;
}

/** 0–1 for the streak ring: this week's done / planned. */
export function streakWeekFraction(streak: StreakSummary): number {
  return streak.thisWeek ? Math.min(1, streak.thisWeek.done / streak.thisWeek.planned) : 0;
}

const VOLUME_TYPES: ReadonlySet<AchievementType> = new Set(['volume_10k', 'volume_50k', 'volume_100k', 'volume_500k', 'volume_1m']);

/** '12,400 kg' */
export function formatVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString('en-US')} kg`;
}

/** A locked one-time achievement: '7 / 10', '4,000 / 10,000 kg'; repeatable: '×3' or null. */
export function describeAchievementProgress(progress: AchievementProgress): string | null {
  if (progress.repeatable || progress.threshold === undefined) {
    return progress.count > 0 ? `×${progress.count}` : null;
  }
  const current = Math.min(progress.current, progress.threshold);
  if (VOLUME_TYPES.has(progress.type)) {
    return `${Math.round(current).toLocaleString('en-US')} / ${formatVolume(progress.threshold)}`;
  }
  return `${current} / ${progress.threshold}`;
}

/** 0–1 towards a one-time achievement (repeatable: 1 once unlocked). */
export function achievementProgressFraction(progress: AchievementProgress): number {
  if (progress.count > 0) return 1;
  if (progress.repeatable || !progress.threshold) return 0;
  return Math.min(1, progress.current / progress.threshold);
}

/** '3 of 28 unlocked' — repeatables count once. */
export function achievementCountLabel(progress: AchievementProgress[]): string {
  const unlocked = progress.filter((entry) => entry.count > 0).length;
  return `${unlocked} of ${progress.length} unlocked`;
}
