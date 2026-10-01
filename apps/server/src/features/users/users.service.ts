import { User, isOnboardingCompleted } from './user.model';
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
