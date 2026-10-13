import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

// PLACEHOLDER English (the design is Hebrew).
export const en: CopyShape<typeof he> = {
  title: 'Statistics',
  subtitle: "How the business and the trainees' consistency are doing",
  loadError: "Couldn't load the statistics.",
  rangeLabel: 'Time range',
  chartEmpty: 'Not enough data for this chart yet',
  noChange: 'No change',
  ranges: { months3: '3 months', months6: '6 months', months12: 'Year' },
  tiles: {
    active: 'Active trainees',
    activeChange: 'this month',
    newThisMonth: 'New trainees this month',
    newChange: 'vs last month',
    completion: 'Average workout completion',
    completionNote: 'of the planned workouts',
    timeToPlan: 'Average time to a plan',
    timeToPlanNote: 'of the 48-hour window',
    hours: 'h',
    windowMark: '48 hours',
  },
  active: {
    title: 'Active trainees',
    subtitle: 'At the end of each month',
    label: 'Active trainees by month',
    unit: 'trainees',
    inRange: '{change} in the period',
    sinceLastMonth: '{change} from the month before',
  },
  weekly: {
    title: 'Workouts done per week',
    subtitle: 'The last 8 weeks',
    label: 'Workouts done per week',
    unit: 'workouts',
    thisWeek: 'this week',
    average: 'Average {value}',
    week: 'Week {number}',
    sinceLastWeek: '{change} from the week before',
  },
  goals: {
    title: "The trainees' goals",
    subtitle: 'Of {count} active trainees',
    empty: 'No goals to show yet.',
  },
  retention: {
    title: 'Trainee retention',
    subtitle: 'How many are still active after…',
    month1: '1 month',
    month3: '3 months',
    month6: '6 months',
    rating: 'Average workout rating',
    noData: 'No data yet',
    count: '{retained} of {eligible}',
  },
  dataPoint: '{label}: {value}',
};
