import { appEvents } from '../../events/appEvents';
import type { TraineeOnboardedEvent } from '../../events/appEvents';
import { aiUnavailableReason } from '../ai/ai.config';
import { startRecommendation } from './aiRecommendation.service';

// PRD §8: when a trainee completes onboarding, a draft plan is generated for her coach.
// Onboarding never waits for it and never fails because of it.

export async function onTraineeOnboardedStartDraft(event: TraineeOnboardedEvent): Promise<void> {
  // No coach yet: nobody to draft for. AI off on this server: nothing to do.
  if (!event.coachId || aiUnavailableReason()) return;
  await startRecommendation({ traineeId: event.traineeId, coachId: event.coachId, type: 'training_plan', trigger: 'onboarding' });
}

let registered = false;

/** Called once when the app is created; calling it again does nothing. */
export function registerAiRecommendationListeners(): void {
  if (registered) return;
  registered = true;
  appEvents.on('trainee.onboarded', onTraineeOnboardedStartDraft);
}
