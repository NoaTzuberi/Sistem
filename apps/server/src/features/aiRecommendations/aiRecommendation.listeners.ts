import { appEvents } from '../../events/appEvents';
import type { TraineeOnboardedEvent } from '../../events/appEvents';
import { aiUnavailableReason } from '../ai/ai.config';
import { coachHasActiveFoods } from '../nutrition/foodItem.service';
import { startRecommendation } from './aiRecommendation.service';

// PRD §8 / §5.6: when a trainee completes onboarding, a training draft and a nutrition
// draft are generated for her coach. Onboarding never waits for them and never fails
// because of them.

export async function onTraineeOnboardedStartDraft(event: TraineeOnboardedEvent): Promise<void> {
  // No coach yet: nobody to draft for. AI off on this server: nothing to do.
  if (!event.coachId || aiUnavailableReason()) return;
  await startRecommendation({ traineeId: event.traineeId, coachId: event.coachId, type: 'training_plan', trigger: 'onboarding' });
  // The nutrition draft needs the coach's food list; without one there is nothing to draft from.
  if (await coachHasActiveFoods(event.coachId)) {
    await startRecommendation({ traineeId: event.traineeId, coachId: event.coachId, type: 'nutrition_plan', trigger: 'onboarding' });
  }
}

let registered = false;

/** Called once when the app is created; calling it again does nothing. */
export function registerAiRecommendationListeners(): void {
  if (registered) return;
  registered = true;
  appEvents.on('trainee.onboarded', onTraineeOnboardedStartDraft);
}
