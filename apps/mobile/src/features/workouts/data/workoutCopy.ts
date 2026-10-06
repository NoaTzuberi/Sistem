import type { LastPerformance, SetType, TraineePlanWorkout } from '@sistem/types';
import { formatDuration } from '@sistem/shared';
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
  startWorkout: 'Start workout',
  resumeWorkout: 'Resume workout',
  // Next week's workouts open when their week starts (the server refuses them before).
  notStartableYet: 'You can start this workout when its week begins.',
  viewLog: 'View what you logged',
  addSummary: 'Add summary',
  editSummary: 'Edit summary',
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

// The active workout session (Phase 8). PLACEHOLDER copy as well.
export const SESSION_COPY = {
  leave: 'Leave — the workout stays open',
  menu: 'More',
  soundOff: 'Sound off',
  soundOn: 'Sound on',
  setsProgress: (done: number, total: number) => `${done} / ${total} sets`,
  now: 'Now',
  supersetLabel: (group: string) => `Superset ${group}`,
  lastTime: 'Last time:',
  columnSet: 'Set',
  columnKg: 'kg',
  columnReps: 'Reps',
  columnSec: 'Sec',
  columnDone: 'Done',
  markDone: (setLabel: string) => `Mark set ${setLabel} done`,
  markNotDone: (setLabel: string) => `Mark set ${setLabel} not done`,
  startHold: (seconds: string) => `Start ${seconds}`,
  stopHold: 'Stop',
  decrease: 'Decrease',
  increase: 'Increase',
  rest: 'Rest',
  restLess: (sec: number) => `−${sec}s`,
  restMore: (sec: number) => `+${sec}s`,
  restSkip: 'Skip',
  restOver: 'Rest over',
  restOverNext: (next: string) => `Rest over — next: ${next}`,
  finish: 'Finish workout',
  finishing: 'Finishing…',
  offline: 'Offline — saved on this phone',
  saving: 'Saving…',
  finishQueued: "No connection. Your sets are saved on this phone — the workout finishes as soon as you're back online.",
  confirmFinishTitle: 'Finish workout?',
  notDoneCount: (count: number) => `${count} ${count === 1 ? 'set is' : 'sets are'} not done.`,
  finishAnyway: 'Finish anyway',
  keepGoing: 'Keep going',
  nothingDoneTitle: 'Nothing logged yet',
  nothingDone: 'Mark at least one set done, or discard the workout.',
  ok: 'OK',
  menuTitle: 'Workout',
  discard: 'Discard workout',
  confirmDiscardTitle: 'Discard this workout?',
  confirmDiscard: "Your logged sets won't count. You can start this workout again later.",
  discardConfirm: 'Discard',
  cancel: 'Cancel',
  discardOffline: 'Discarding needs a connection. Try again when you are back online.',
  discardError: "Couldn't discard the workout.",
  finishError: "Couldn't finish the workout.",
  notActive: 'This workout was already finished or discarded.',
  loading: 'Loading your workout…',
  loadError: "Couldn't load this workout.",
  notFound: 'This workout session no longer exists.',
  startError: "Couldn't start the workout.",
  startOffline: 'Starting a workout needs a connection.',
  conflictTitle: 'Another workout is open',
  conflictText: (title: string) => `"${title}" is still in progress. Resume it, or discard it and start this one.`,
  conflictResume: (title: string) => `Resume ${title}`,
  conflictDiscardAndStart: 'Discard it and start this one',
} as const;

const SET_TAGS: Record<SetType, string> = { warmup: 'W', working: '', drop: 'D' };

/** 'W' warm-up, 'D' drop, or the working set's number (counted among working sets only). */
export function setTag(type: SetType, workingNumber: number): string {
  return SET_TAGS[type] || String(workingNumber);
}

/** "40 kg × 10", "45s · 5 kg", "12 reps". */
export function lastTimeLabel(last: LastPerformance): string {
  const parts: string[] = [];
  if (last.durationSec !== undefined) parts.push(formatDuration(last.durationSec));
  if (last.weight !== undefined && last.reps !== undefined) parts.push(`${last.weight} kg × ${last.reps}`);
  else if (last.reps !== undefined) parts.push(`${last.reps} reps`);
  else if (last.weight !== undefined) parts.push(`${last.weight} kg`);
  return parts.join(' · ');
}

/** 1:05 — a running clock (rest, a hold, time since start). */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// The interval timer (Phase 8). PLACEHOLDER copy as well.
export const INTERVAL_COPY = {
  phase: { ready: 'Get ready', work: 'Work', rest: 'Rest' },
  round: (round: number, rounds: number) => `Round ${round} of ${rounds}`,
  first: (label: string) => `First: ${label}`,
  next: 'Next:',
  nextRestThen: (rest: string, label: string) => `Rest ${rest}${label ? ` → ${label}` : ''}`,
  nextWork: 'Work',
  lastOne: 'Last one',
  pause: 'Pause',
  resume: 'Resume',
  paused: 'Paused',
  skip: 'Skip',
  stop: 'Stop interval',
  mute: 'Sound off',
  unmute: 'Sound on',
  confirmStopTitle: 'Stop the interval?',
  confirmStop: 'Sets already logged stay done.',
  confirmStopFree: 'The timer stops here.',
  stopConfirm: 'Stop',
  keepGoing: 'Keep going',
  catchUpTitle: 'Welcome back',
  catchUp: (count: number) =>
    `While you were away, ${count} work ${count === 1 ? 'period' : 'periods'} ended. Mark them as done?`,
  catchUpYes: 'Yes, I did them',
  catchUpNo: 'No',
  doneTitle: 'Interval done',
  roundsDone: (done: number, rounds: number) => `${done} / ${rounds} rounds`,
  backToWorkout: 'Back to workout',
  close: 'Done',
  again: 'Again',
  startInterval: 'Start interval',
  // The free timer.
  timerTitle: 'Interval timer',
  timerWork: 'Work',
  timerRest: 'Rest',
  timerRounds: 'Rounds',
  timerTotal: (total: string) => `Total ${total}`,
  timerStart: 'Start',
  back: 'Back',
} as const;

// The workout summary (Phase 9, PRD §5.3). PLACEHOLDER copy — the owner sends the final text.
export const SUMMARY_COPY = {
  title: 'Workout complete',
  close: 'Close',
  loading: 'Loading…',
  loadError: "Couldn't load your workout.",
  notFinished: 'This workout is not finished yet.',
  statDuration: 'Duration',
  statVolume: 'Total volume',
  statSets: 'Sets done',
  statPrs: 'PRs',
  personalRecords: 'Personal records',
  ratingQuestion: 'How was it?',
  ratingOption: (value: number) => `${value} out of 5`,
  notes: 'Notes',
  notesPlaceholder: 'Anything to remember or tell your coach?',
  save: 'Save & finish',
  saveError: "Couldn't save your summary. Try again.",
  rating: 'Rating',
} as const;

export const PUMP_PHOTO_COPY = {
  title: 'Daily Pump',
  privacy: 'Visible only to you and your coach',
  takePhoto: 'Take photo',
  chooseFromGallery: 'Gallery',
  remove: 'Remove',
  removeTitle: 'Remove this photo?',
  removeConfirm: 'Remove photo',
  cancel: 'Cancel',
  preparing: 'Preparing photo…',
  uploading: (percent: number) => `Uploading… ${percent}%`,
  open: 'Open photo',
  alt: 'Daily Pump photo',
  noPhoto: 'No Daily Pump photo.',
  readError: "Couldn't read this photo. Try another one.",
  tooLarge: 'This photo is too large. Try another one.',
  uploadError: "Couldn't upload the photo.",
  offline: 'No connection — the photo needs a connection to upload.',
  removeError: "Couldn't remove the photo.",
  retry: 'Try again',
} as const;

// Shown once when a workout is freshly started (PRD §14 — the native version is Phase 5b).
export const FOCUS_TIP_COPY = {
  text: 'Tip: turn on Focus / Do Not Disturb so nothing interrupts your workout.',
  gotIt: 'Got it',
  dontShowAgain: "Don't show again",
} as const;
