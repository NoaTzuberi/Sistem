import type { AuthUser, UpdatePreferencesPayload } from '@sistem/types';
import { User, isOnboardingCompleted } from './user.model';
import { toPublicUser } from '../auth/auth.service';
import { OnboardingResponse } from '../onboarding/onboardingResponse.model';

export class UserNotFoundError extends Error {}

/**
 * Read model for the Profile page. Same response shape as ATLAS's User.profile, now
 * assembled from the User and the OnboardingResponse collection.
 */
export async function getUserProfileById(userId: string) {
  const user = await User.findById(userId).select('name preferences onboardingStatus').lean();
  if (!user) {
    throw new UserNotFoundError('User not found.');
  }
  const response = await OnboardingResponse.findOne({ userId }).select('answers').lean();

  return {
    name: user.name,
    onboardingCompleted: isOnboardingCompleted(user),
    profile: response?.answers,
    preferences: user.preferences,
  };
}

/** Changes her display units (Phase 10); each unit is set on its own, the others stay. */
export async function updateUserPreferences(userId: string, payload: UpdatePreferencesPayload): Promise<AuthUser> {
  const $set: Record<string, string> = {};
  if (payload.units.weight) $set['preferences.units.weight'] = payload.units.weight;
  if (payload.units.length) $set['preferences.units.length'] = payload.units.length;
  const user = await User.findByIdAndUpdate(userId, { $set }, { returnDocument: 'after', runValidators: true });
  if (!user) {
    throw new UserNotFoundError('User not found.');
  }
  return toPublicUser(user);
}
