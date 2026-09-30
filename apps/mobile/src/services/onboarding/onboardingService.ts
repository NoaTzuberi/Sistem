import type { AppState, UserRole } from '@sistem/types';
import { apiClient } from '../api/apiClient';
import type { OnboardingFormState } from '../../features/onboarding/types';

interface OnboardingProfilePayload {
  name?: string;
  birthDate: string;
  height: number;
  weight: number;
  gender?: string;
  units: {
    weight: 'kg' | 'lb';
    distance: 'km' | 'miles';
  };
  goals: string[];
  trainingFrequency: {
    minDays: number;
    maxDays: number;
    flexibleSchedule: boolean;
  };
  preferredActivities: string[];
  exercisePreferences: {
    favoriteExerciseNotes?: string;
    improvementExerciseNotes?: string;
    muscleFocus: string[];
  };
  equipment: string[];
  recovery: {
    flags: string[];
    notes?: string;
  };
}

interface OnboardingProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    appState: AppState;
    onboardingCompleted: boolean;
    profile: unknown;
    preferences: unknown;
  };
}

export async function saveOnboardingProfile(
  formState: OnboardingFormState,
): Promise<OnboardingProfileResponse> {
  const payload: OnboardingProfilePayload = {
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

  const { data } = await apiClient.put<OnboardingProfileResponse>('/users/profile', payload);
  return data;
}
