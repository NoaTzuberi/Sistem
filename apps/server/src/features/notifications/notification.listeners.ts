import { appEvents } from '../../events/appEvents';
import type {
  NutritionPlanPublishedEvent,
  PlanPublishedEvent,
  TraineeOnboardedEvent,
  WorkoutCompletedEvent,
} from '../../events/appEvents';
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

/** To her coach — read from the trainee now, so a later coach change is respected. */
export async function onWorkoutCompleted(event: WorkoutCompletedEvent): Promise<void> {
  const trainee = await User.findById(event.traineeId).select('name coachId').lean();
  if (!trainee?.coachId) return;

  await notify(String(trainee.coachId), {
    type: 'workout_completed',
    data: { traineeId: event.traineeId, traineeName: trainee.name, logId: event.logId, workoutTitle: event.workoutTitle },
  });
}

/** To the trainee — her app builds the wording; tap → the Nutrition tab. */
export async function onNutritionPlanPublished(event: NutritionPlanPublishedEvent): Promise<void> {
  await notify(event.traineeId, {
    type: 'nutrition_plan_published',
    data: { planId: event.planId, version: event.version, isUpdate: event.version > 1 },
  });
}

let registered = false;

/** Called once when the app is created; calling it again does nothing. */
export function registerNotificationListeners(): void {
  if (registered) return;
  registered = true;
  appEvents.on('trainee.onboarded', onTraineeOnboarded);
  appEvents.on('plan.published', onPlanPublished);
  appEvents.on('workout.completed', onWorkoutCompleted);
  appEvents.on('nutrition_plan.published', onNutritionPlanPublished);
}
