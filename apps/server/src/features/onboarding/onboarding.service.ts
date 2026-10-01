import type { HydratedDocument } from 'mongoose';
import type {
  MyOnboarding,
  OnboardingAnswers,
  OnboardingAnswersPayload,
  OnboardingSaveResponse,
  OnboardingStepId,
} from '@sistem/types';
import { User } from '../users/user.model';
import type { UserDocument } from '../users/user.model';
import { toPublicUser } from '../auth/auth.service';
import { OnboardingResponse } from './onboardingResponse.model';
import type { OnboardingAnswersFields, OnboardingResponseDocument } from './onboardingResponse.model';

export class OnboardingUserNotFoundError extends Error {}

type UserDoc = HydratedDocument<UserDocument>;

function toPublicAnswers(answers: OnboardingAnswersFields): OnboardingAnswers {
  return {
    birthDate: answers.birthDate ? answers.birthDate.toISOString() : undefined,
    height: answers.height,
    weight: answers.weight,
    gender: answers.gender,
    goals: answers.goals ?? [],
    trainingFrequency: answers.trainingFrequency,
    preferredActivities: answers.preferredActivities ?? [],
    exercisePreferences: answers.exercisePreferences,
    equipment: answers.equipment ?? [],
    recovery: answers.recovery,
  };
}

export function toMyOnboarding(
  user: Pick<UserDocument, 'name' | 'onboardingStatus' | 'preferences'>,
  response: Pick<OnboardingResponseDocument, 'answers' | 'lastStep' | 'completedAt'> | null,
): MyOnboarding {
  return {
    status: user.onboardingStatus,
    lastStep: response?.lastStep ?? null,
    completedAt: response?.completedAt ? response.completedAt.toISOString() : null,
    name: user.name,
    units: user.preferences?.units ?? null,
    answers: response ? toPublicAnswers(response.answers) : null,
  };
}

/** The answers as stored: `name` and `units` live on the User, the rest in answers. */
function toAnswerUpdates(payload: OnboardingAnswersPayload): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (payload.birthDate !== undefined) updates.birthDate = new Date(payload.birthDate);
  if (payload.height !== undefined) updates.height = payload.height;
  if (payload.weight !== undefined) updates.weight = payload.weight;
  if (payload.gender !== undefined) updates.gender = payload.gender || undefined;
  if (payload.goals !== undefined) updates.goals = payload.goals;
  if (payload.trainingFrequency !== undefined) updates.trainingFrequency = payload.trainingFrequency;
  if (payload.preferredActivities !== undefined) updates.preferredActivities = payload.preferredActivities;
  if (payload.exercisePreferences !== undefined) {
    updates.exercisePreferences = {
      favoriteExerciseNotes: payload.exercisePreferences.favoriteExerciseNotes,
      improvementExerciseNotes: payload.exercisePreferences.improvementExerciseNotes,
      muscleFocus: payload.exercisePreferences.muscleFocus ?? [],
    };
  }
  if (payload.equipment !== undefined) updates.equipment = payload.equipment;
  if (payload.recovery !== undefined) {
    updates.recovery = { flags: payload.recovery.flags ?? [], notes: payload.recovery.notes };
  }
  return updates;
}

async function findTrainee(userId: string): Promise<UserDoc> {
  const user = await User.findById(userId);
  if (!user) {
    throw new OnboardingUserNotFoundError('User not found.');
  }
  return user;
}

async function saveAnswers(user: UserDoc, payload: OnboardingAnswersPayload, step: OnboardingStepId) {
  const response =
    (await OnboardingResponse.findOne({ userId: user._id })) ?? new OnboardingResponse({ userId: user._id });

  for (const [field, value] of Object.entries(toAnswerUpdates(payload))) {
    response.set(`answers.${field}`, value);
  }
  response.lastStep = step;

  if (payload.name !== undefined) user.name = payload.name.trim();
  if (payload.units !== undefined) user.preferences = { units: payload.units };

  return response;
}

export async function getMyOnboarding(userId: string): Promise<MyOnboarding> {
  const user = await findTrainee(userId);
  const response = await OnboardingResponse.findOne({ userId }).lean();
  return toMyOnboarding(user, response);
}

/**
 * Saves one step's answers (validated by the caller) and records it as the last
 * step. Also used by the Profile page's "edit one step", which never changes the
 * onboarding status or the 48h timer of a finished onboarding.
 */
export async function saveOnboardingStep(
  userId: string,
  step: OnboardingStepId,
  payload: OnboardingAnswersPayload,
): Promise<OnboardingSaveResponse> {
  const user = await findTrainee(userId);
  const response = await saveAnswers(user, payload, step);

  if (user.onboardingStatus === 'not_started') {
    user.onboardingStatus = 'in_progress';
  }

  await response.save();
  await user.save();
  return { user: await toPublicUser(user), onboarding: toMyOnboarding(user, response) };
}

/**
 * Final submit with every answer (validated by the caller). Completion time comes
 * from the server clock and is set only once, so re-submitting never restarts the
 * 48h window.
 */
export async function completeOnboarding(userId: string, payload: OnboardingAnswersPayload): Promise<OnboardingSaveResponse> {
  const user = await findTrainee(userId);
  const response = await saveAnswers(user, payload, 'review');
  const now = new Date();

  response.completedAt ??= now;
  user.onboardingStatus = 'completed';
  user.onboardingCompletedAt ??= now;

  await response.save();
  await user.save();
  return { user: await toPublicUser(user), onboarding: toMyOnboarding(user, response) };
}
