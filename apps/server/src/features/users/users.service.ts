import { User } from './user.model';
import { getAppState } from './appState.service';

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
  exercisePreferences?: {
    favoriteExerciseNotes?: string;
    improvementExerciseNotes?: string;
    muscleFocus?: string[];
  };
  equipment: string[];
  recovery?: {
    flags?: string[];
    notes?: string;
  };
}

export class UserNotFoundError extends Error {}

export async function updateUserProfile(userId: string, payload: OnboardingProfilePayload) {
  const user = await User.findById(userId);
  if (!user) {
    throw new UserNotFoundError('User not found.');
  }

  if (payload.name) {
    user.name = payload.name;
  }

  user.profile = {
    birthDate: new Date(payload.birthDate),
    height: payload.height,
    weight: payload.weight,
    gender: payload.gender,
    goals: payload.goals,
    trainingFrequency: payload.trainingFrequency,
    preferredActivities: payload.preferredActivities,
    exercisePreferences: {
      favoriteExerciseNotes: payload.exercisePreferences?.favoriteExerciseNotes,
      improvementExerciseNotes: payload.exercisePreferences?.improvementExerciseNotes,
      muscleFocus: payload.exercisePreferences?.muscleFocus ?? [],
    },
    equipment: payload.equipment,
    recovery: {
      flags: payload.recovery?.flags ?? [],
      notes: payload.recovery?.notes,
    },
  };

  user.preferences = {
    units: payload.units,
  };

  user.onboardingCompleted = true;

  await user.save();

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    // Returned so the client can leave onboarding without a second /auth/me call.
    appState: await getAppState(String(user._id), user),
    onboardingCompleted: user.onboardingCompleted,
    profile: user.profile,
    preferences: user.preferences,
  };
}

export async function getUserProfileById(userId: string) {
  const user = await User.findById(userId).select('name profile preferences onboardingCompleted').lean();
  if (!user) {
    throw new UserNotFoundError('User not found.');
  }

  return {
    name: user.name,
    onboardingCompleted: user.onboardingCompleted,
    profile: user.profile,
    preferences: user.preferences,
  };
}
