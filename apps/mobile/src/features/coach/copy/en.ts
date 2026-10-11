import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  plansLoadError: "Couldn't load the plans.",
  publishError: "Couldn't publish the plan. Please try again.",
  copySavedNotPublished: 'The copy was saved as a draft, but it was not published. {message}',
  publishPlan: 'Publish plan',
  noPlanThisWeek: 'No plan for this week yet.',
  duplicateLastWeek: 'Duplicate last week and publish',
  fixOnDashboard: 'Fix it on the dashboard, then publish.',
  plansOnDashboard: 'Plans are built and edited on the dashboard, on a computer.',
  confirmDuplicateTitle: 'Duplicate and publish?',
  confirmPublishTitle: 'Publish this plan?',
  confirmDuplicateMessage: "{name}'s most recent plan will be copied to {week} and published. The trainee will be notified.",
  confirmPublishMessage: '{name} will see the plan for {week}. The trainee will be notified.',
  duplicateConfirm: 'Duplicate and publish',
  publishConfirm: 'Publish',
  nutritionLoadError: "Couldn't load the nutrition plan.",
  // PLACEHOLDER English of the owner's Hebrew line.
  openFullDashboard: 'Open the full dashboard',
};
