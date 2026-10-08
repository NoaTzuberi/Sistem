import type { HydratedDocument } from 'mongoose';
import type {
  MyOnboarding,
  NutritionPreferences,
  OnboardingAnswers,
  OnboardingAnswersPayload,
  OnboardingSaveResponse,
  OnboardingStepId,
  WaitingStatus,
  WeightUnit,
} from '@sistem/types';
import { User } from '../users/user.model';
import type { UserDocument } from '../users/user.model';
import { toPublicUser } from '../auth/auth.service';
import { getAppState } from '../users/appState.service';
import { emitAppEvent } from '../../events/appEvents';
import { lbToKg } from '../users/units';
import { localDateString } from '../plans/planWeek';
import { recordOnboardingWeight } from '../bodyMetrics/bodyMetric.service';
import { PLAN_WAIT_MS } from './onboarding.constants';
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
    ...(answers.nutritionPreferences ? { nutritionPreferences: toPublicNutritionPreferences(answers.nutritionPreferences) } : {}),
  };
}

function toPublicNutritionPreferences(preferences: NutritionPreferences): NutritionPreferences {
  return {
    dietType: preferences.dietType,
    kosher: preferences.kosher,
    allergies: preferences.allergies ?? [],
    ...(preferences.allergyNotes ? { allergyNotes: preferences.allergyNotes } : {}),
    ...(preferences.dislikes ? { dislikes: preferences.dislikes } : {}),
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

/**
 * The answers as stored: `name` and `units` live on the User, the rest in answers.
 * The weight is typed in her chosen unit and always stored in kg (a 140 lb answer used
 * to be stored as 140 kg). The height field is in cm whatever she chose — stored as is.
 */
function toAnswerUpdates(payload: OnboardingAnswersPayload, weightUnit: WeightUnit): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (payload.birthDate !== undefined) updates.birthDate = new Date(payload.birthDate);
  if (payload.height !== undefined) updates.height = payload.height;
  if (payload.weight !== undefined) updates.weight = weightUnit === 'lb' ? lbToKg(payload.weight) : payload.weight;
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
  if (payload.nutritionPreferences !== undefined) {
    const preferences = payload.nutritionPreferences;
    updates.nutritionPreferences = {
      dietType: preferences.dietType,
      kosher: preferences.kosher,
      allergies: [...new Set(preferences.allergies ?? [])],
      allergyNotes: preferences.allergyNotes?.trim() || undefined,
      dislikes: preferences.dislikes?.trim() || undefined,
    };
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

  // The unit sent with the weight (same step), else the one she chose earlier.
  const weightUnit = payload.units?.weight ?? user.preferences?.units?.weight ?? 'kg';
  for (const [field, value] of Object.entries(toAnswerUpdates(payload, weightUnit))) {
    response.set(`answers.${field}`, value);
  }
  response.lastStep = step;

  if (payload.name !== undefined) user.name = payload.name.trim();
  // Set one by one: the length unit (Settings) is not part of onboarding and must stay.
  if (payload.units !== undefined) {
    user.set('preferences.units.weight', payload.units.weight);
    user.set('preferences.units.distance', payload.units.distance);
  }

  return response;
}

/** The weight unit she chose earlier — the answers are validated in it when a save carries no units. */
export async function getStoredWeightUnit(userId: string): Promise<WeightUnit> {
  const user = await User.findById(userId).select('preferences').lean();
  return user?.preferences?.units?.weight ?? 'kg';
}

export async function getMyOnboarding(userId: string): Promise<MyOnboarding> {
  const user = await findTrainee(userId);
  const response = await OnboardingResponse.findOne({ userId }).lean();
  return toMyOnboarding(user, response);
}

/**
 * Polled by the waiting screen: the countdown's two server timestamps, plus the
 * app state so the screen can move to Home as soon as a plan is published.
 */
export async function getWaitingStatus(userId: string): Promise<WaitingStatus> {
  const user = await findTrainee(userId);
  const completedAt = user.onboardingCompletedAt;
  return {
    appState: await getAppState(userId, user),
    serverTime: new Date().toISOString(),
    planDueAt: completedAt ? new Date(completedAt.getTime() + PLAN_WAIT_MS).toISOString() : null,
  };
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
  const isFirstCompletion = !user.onboardingCompletedAt;

  response.completedAt ??= now;
  user.onboardingStatus = 'completed';
  user.onboardingCompletedAt ??= now;

  await response.save();
  await user.save();

  // Only the first completion: a re-submit must not notify the coach again, and the
  // onboarding weight becomes the first point of her weight chart only once — editing
  // the answer later never rewrites her weigh-in history.
  if (isFirstCompletion) {
    if (response.answers.weight !== undefined) {
      await recordOnboardingWeight(user.id, localDateString(now, user.timezone), response.answers.weight);
    }
    emitAppEvent('trainee.onboarded', {
      traineeId: user.id,
      coachId: user.coachId ? String(user.coachId) : null,
      completedAt: now,
    });
  }

  return { user: await toPublicUser(user), onboarding: toMyOnboarding(user, response) };
}
