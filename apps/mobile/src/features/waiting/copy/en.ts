import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

// PLACEHOLDER English for the keys of the waiting design update (the owner sent Hebrew only).
export const en: CopyShape<typeof he> = {
  title: 'Your plan is being built',
  readyTitle: 'Your plan is ready!',
  message: 'Your coach is building your personal plan.',
  messageNote: "We'll let you know as soon as it's ready.",
  overdueMessage: "Your coach is putting the final touches on your plan. You'll get a notification as soon as it's ready.",
  countdownLabel: 'Time remaining',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  enableNotifications: 'Turn on notifications',
};
