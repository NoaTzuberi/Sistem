import { appEvents } from '../../events/appEvents';
import type { PlanPublishedEvent, TraineeOnboardedEvent } from '../../events/appEvents';
import { User } from '../users/user.model';
import { notify } from './notification.service';

// Turns domain events into notifications (PRD §9). The features that emit the
// events know nothing about notifications.

export async function onTraineeOnboarded(event: TraineeOnboardedEvent): Promise<void> {
  // No coach assigned yet: there is nobody to tell.
  if (!event.coachId) return;

  const trainee = await User.findById(event.traineeId).select('name').lean();
  if (!trainee) return;

  await notify(event.coachId, {
    type: 'trainee_onboarded',
    data: { traineeId: event.traineeId, traineeName: trainee.name },
  });
}

export async function onPlanPublished(event: PlanPublishedEvent): Promise<void> {
  await notify(event.traineeId, {
    type: 'plan_published',
    data: { planId: event.planId, weekStartDate: event.weekStartDate },
  });
}

let registered = false;

/** Called once when the app is created; calling it again does nothing. */
export function registerNotificationListeners(): void {
  if (registered) return;
  registered = true;
  appEvents.on('trainee.onboarded', onTraineeOnboarded);
  appEvents.on('plan.published', onPlanPublished);
}
