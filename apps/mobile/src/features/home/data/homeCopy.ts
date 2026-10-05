// Wording of the trainee's Home. PLACEHOLDER copy — the owner sends the final text.
export const HOME_COPY = {
  greeting: (firstName: string) => `Hi, ${firstName}`,
  weekOf: 'Week of',
  nextWorkout: 'Next workout',
  startNextWorkout: 'Start next workout',
  resumeWorkout: (title: string) => `Resume workout · ${title}`,
  thisWeek: 'This week',
  noPlanThisWeek: 'No plan for this week yet.',
  noWorkoutsInPlan: 'No workouts in this plan.',
  allDone: 'All of this week\'s workouts are done.',
  intervalTimer: 'Interval timer',
  achievements: 'Recent achievements',
  noAchievements: 'No achievements yet.',
  // Streaks are computed in Phase 11; until then the ring stays empty.
  streak: 'Streak',
  streakComingSoon: 'Coming soon',
  loading: 'Loading…',
  loadError: "Couldn't load your week.",
} as const;
