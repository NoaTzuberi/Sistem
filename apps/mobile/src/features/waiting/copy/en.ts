import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  title: 'Your plan is being built',
  message: 'Your personalized workouts will be ready within 48 hours.',
  overdueMessage: "Your coach is putting the final touches on your plan. You'll get a notification as soon as it's ready.",
  countdownLabel: 'Time remaining',
};
