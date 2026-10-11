import { plural } from '@sistem/shared';
import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

// PLACEHOLDER English (the design is Hebrew).
export const en: CopyShape<typeof he> = {
  greeting: {
    morning: 'Good morning, {name}',
    afternoon: 'Good afternoon, {name}',
    evening: 'Good evening, {name}',
    night: 'Good night, {name}',
  },
  weekLine: 'Week {week} · {date}',
  activeTrainees: 'Active trainees',
  newThisMonth: 'New trainees this month',
  loadError: "Couldn't load the overview.",
  completion: {
    title: 'Workouts done this week',
    caption: '{done} of the {planned} workouts you planned were done',
    empty: 'No workouts planned this week',
    weeks: 'Last 8 weeks',
  },
  waiting: {
    title: 'Waiting for a plan',
    window: 'The 48-hour window',
    more: 'and {count} more',
  },
  pump: {
    title: 'Daily Pump',
    subtitle: 'New photos from the workouts',
    newSince: 'new since yesterday',
  },
  board: {
    title: "The trainees' week",
    subtitle: 'The last 7 days',
    today: 'Today',
    done: 'Done',
    planned: 'Planned',
    missed: 'Missed',
    allTrainees: 'All trainees',
    empty: 'No workouts planned in the last 7 days.',
  },
  activity: {
    title: 'Recent activity',
    subtitle: 'What happened in the last hours',
  },
  ending: {
    title: 'Plans ending this week',
    subtitle: 'Time to build next week',
    daysLeft: plural({ one: '1 more day', other: '{count} more days' }),
    endsToday: 'Ends today',
    workouts: '{done} / {planned} workouts',
    buildNext: 'Build next week',
  },
};
