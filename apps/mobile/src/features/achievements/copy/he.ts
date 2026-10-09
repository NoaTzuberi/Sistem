import { plural } from '@sistem/shared';

// Achievements & streak on the phone (Phase 11). PLACEHOLDER copy — the owner sends the final text. Names of the
// achievements live in the shared copy (describeAchievement). DRAFT Hebrew (phase-15 report).
export const he = {
  streak: 'רצף',
  streakValue: plural({ one: 'שבוע אחד', two: 'שבועיים', other: '{count} שבועות' }),
  streakUnit: plural({ one: 'שבוע', two: 'שבועות', other: 'שבועות' }),
  bestStreak: 'שיא: {label}',
  noPlanThisWeek: 'אין תוכנית השבוע',
  recent: 'הישגים אחרונים',
  none: 'עדיין אין הישגים.',
  seeAll: 'לכל ההישגים',
  allTitle: 'הישגים',
  unlockedTitle: 'נפתחו',
  lockedTitle: 'עוד לפתוח',
  unlockedOn: 'נפתח ב־{date}',
  times: '×{count}',
  loading: 'טוען…',
  loadError: 'לא הצלחנו לטעון את ההישגים שלך.',
  unlockedThisWorkout: 'הישגים שנפתחו',
  celebrationTitle: plural({ one: 'הישג חדש נפתח!', two: 'שני הישגים חדשים נפתחו!', other: '{count} הישגים חדשים נפתחו!' }),
  celebrationDone: 'יש!',
  statsTitle: 'ההתקדמות שלך',
  statWorkouts: 'אימונים',
  statVolume: 'נפח כולל',
  statPrs: 'שיאים אישיים',
  statAchievements: 'הישגים',
  back: 'חזרה',
} as const;
