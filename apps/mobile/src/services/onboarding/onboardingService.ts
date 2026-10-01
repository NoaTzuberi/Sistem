import type {
  MyOnboarding,
  OnboardingAnswersPayload,
  OnboardingSaveResponse,
  OnboardingStepId,
  SaveOnboardingStepPayload,
} from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';
import type { OnboardingFormState } from '../../features/onboarding/types';

// Answers live in the server's OnboardingResponse collection (Phase 3). `name` and
// `units` are saved on the user; the server handles that split.

// Which answers each step saves — mirrors ONBOARDING_STEP_FIELDS on the server.
const STEP_FIELDS: Record<OnboardingStepId, (keyof OnboardingAnswersPayload)[]> = {
  welcome: [],
  basic_profile: ['name', 'birthDate', 'height', 'weight', 'gender', 'units'],
  goals: ['goals'],
  frequency: ['trainingFrequency'],
  activities: ['preferredActivities'],
  exercise_preferences: ['exercisePreferences'],
  recovery: ['recovery'],
  equipment: ['equipment'],
  review: [],
};

function toAnswersPayload(formState: OnboardingFormState): OnboardingAnswersPayload {
  return {
    name: formState.name.trim() || undefined,
    birthDate: formState.birthDate,
    height: Number(formState.height),
    weight: Number(formState.weight),
    gender: formState.gender.trim() || undefined,
    units: formState.units,
    goals: formState.goals,
    trainingFrequency: formState.trainingFrequency,
    preferredActivities: formState.preferredActivities,
    exercisePreferences: {
      favoriteExerciseNotes: formState.exercisePreferences.favoriteExerciseNotes.trim() || undefined,
      improvementExerciseNotes:
        formState.exercisePreferences.improvementExerciseNotes.trim() || undefined,
      muscleFocus: formState.exercisePreferences.muscleFocus,
    },
    equipment: formState.equipment,
    recovery: {
      flags: formState.recovery.flags,
      notes: formState.recovery.notes.trim() || undefined,
    },
  };
}

function pickStepAnswers(step: OnboardingStepId, formState: OnboardingFormState): OnboardingAnswersPayload {
  const all = toAnswersPayload(formState);
  const answers: OnboardingAnswersPayload = {};
  for (const field of STEP_FIELDS[step]) {
    // Assigning through a widened record: each field keeps its own type from `all`.
    (answers as Record<string, unknown>)[field] = all[field];
  }
  return answers;
}

export async function getMyOnboarding(): Promise<MyOnboarding> {
  try {
    const { data } = await apiClient.get<{ onboarding: MyOnboarding }>('/onboarding');
    return data.onboarding;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't load your answers. Please try again."));
  }
}

/** Saves one step's answers (after every onboarding step, and the Profile page's "edit this step"). */
export async function saveOnboardingStep(
  step: OnboardingStepId,
  formState: OnboardingFormState,
): Promise<OnboardingSaveResponse> {
  const payload: SaveOnboardingStepPayload = { step, answers: pickStepAnswers(step, formState) };
  try {
    const { data } = await apiClient.patch<OnboardingSaveResponse>('/onboarding', payload);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not save your answers. Please try again.'));
  }
}

/** Final submit: every answer; the server stamps the completion time. */
export async function completeOnboarding(formState: OnboardingFormState): Promise<OnboardingSaveResponse> {
  try {
    const { data } = await apiClient.post<OnboardingSaveResponse>('/onboarding/complete', toAnswersPayload(formState));
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not save your profile. Please try again.'));
  }
}
