// All the waiting screen's wording in one place. `overdueMessage` is TEMPORARY copy
// from the owner; `title` and `message` follow PRD §4.1 until she sends final wording.
export const WAITING_COPY = {
  title: 'Your plan is being built',
  // Shown with the countdown, while the 48h window is still running.
  message: 'Your personalized workouts will be ready within 48 hours.',
  // Shown instead of the countdown once the 48h have passed and no plan is published yet.
  overdueMessage:
    "Your coach is putting the final touches on your plan. You'll get a notification as soon as it's ready.",
  // Screen-reader label for the countdown (not visible).
  countdownLabel: 'Time remaining',
} as const;
