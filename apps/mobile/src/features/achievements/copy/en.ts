import { plural, type CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  streak: 'Streak',
  streakValue: plural({ one: '{count} week', other: '{count} weeks' }),
  streakUnit: plural({ one: 'week', other: 'weeks' }),
  bestStreak: 'Best: {label}',
  noPlanThisWeek: 'No plan this week',
  recent: 'Recent achievements',
  none: 'No achievements yet.',
  seeAll: 'See all',
  allTitle: 'Achievements',
  unlockedTitle: 'Unlocked',
  lockedTitle: 'Still to unlock',
  unlockedOn: 'Unlocked {date}',
  times: '×{count}',
  loading: 'Loading…',
  loadError: "Couldn't load your achievements.",
  unlockedThisWorkout: 'Achievements unlocked',
  celebrationTitle: plural({ one: 'Achievement unlocked!', other: '{count} achievements unlocked!' }),
  celebrationDone: 'Nice!',
  statsTitle: 'Your progress',
  statWorkouts: 'Workouts',
  statVolume: 'Total volume',
  statPrs: 'PRs',
  statAchievements: 'Achievements',
  back: 'Back',
};
