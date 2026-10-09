import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  greeting: 'Hi, {firstName}',
  weekOf: 'Week of',
  nextWorkout: 'Next workout',
  startNextWorkout: 'Start next workout',
  resumeWorkout: 'Resume workout · {title}',
  thisWeek: 'This week',
  noPlanThisWeek: 'No plan for this week yet.',
  noWorkoutsInPlan: 'No workouts in this plan.',
  allDone: "All of this week's workouts are done.",
  intervalTimer: 'Interval timer',
  loading: 'Loading…',
  loadError: "Couldn't load your week.",
};
