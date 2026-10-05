import type { TraineePlanWorkout } from '@sistem/types';
import type { BadgeVariant } from '../../../components/common/Badge/Badge';

// Wording of the trainee's Workouts screens. PLACEHOLDER copy — the owner sends the
// final text (the "Missed" label in particular is expected to be softened).

export const WORKOUT_STATUS_LABELS = {
  upcoming: 'Upcoming',
  done: 'Done',
  missed: 'Missed',
  today: 'Today',
  inProgress: 'In progress',
} as const;

export const WORKOUTS_COPY = {
  title: 'Workouts',
  thisWeek: 'This week',
  nextWeek: 'Next week',
  pastWeeks: 'Past weeks',
  completedLogs: 'Completed workouts',
  noPlanThisWeek: 'No plan for this week yet.',
  noWorkoutsInPlan: 'No workouts in this plan.',
  noPastWeeks: 'No past weeks yet.',
  noCompletedLogs: 'No completed workouts yet.',
  anyDay: 'Any day',
  loading: 'Loading…',
  loadError: "Couldn't load your workouts.",
  workoutLoadError: "Couldn't load this workout.",
  workoutNotFound: 'This workout is no longer in your plan.',
  logLoadError: "Couldn't load this workout log.",
  // Phase 8 replaces this line with the button that starts the session.
  sessionComingSoon: 'Logging this workout in the app is coming soon.',
  viewLog: 'View what you logged',
  noPumpPhoto: 'No Daily Pump photo.',
  pumpPhotoUploaded: 'Daily Pump photo uploaded',
  back: 'Back',
} as const;

export function exerciseCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'exercise' : 'exercises'}`;
}

export function doneCountLabel(workouts: TraineePlanWorkout[]): string {
  const done = workouts.filter((workout) => workout.status === 'done').length;
  return `${done} / ${workouts.length} done`;
}

/** The badge of a workout row. The status itself always comes from the server. */
export function workoutStatusBadge(workout: TraineePlanWorkout): { label: string; variant: BadgeVariant } {
  if (workout.status === 'done') return { label: WORKOUT_STATUS_LABELS.done, variant: 'accent' };
  if (workout.inProgress) return { label: WORKOUT_STATUS_LABELS.inProgress, variant: 'solid' };
  if (workout.status === 'missed') return { label: WORKOUT_STATUS_LABELS.missed, variant: 'neutral' };
  if (workout.isToday) return { label: WORKOUT_STATUS_LABELS.today, variant: 'solid' };
  return { label: WORKOUT_STATUS_LABELS.upcoming, variant: 'neutral' };
}
