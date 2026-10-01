import type { AppState, OnboardingStatus, UserRole } from '@sistem/types';
import { hasPublishedPlan } from '../plans/plan.service';

interface AppStateInput {
  role: UserRole;
  onboardingStatus: OnboardingStatus;
}

/**
 * Decides where a signed-in user lands (PRD §4.2). The client only follows this
 * value — it never derives the state itself.
 */
export function resolveAppState(user: AppStateInput, hasPlan: boolean): AppState {
  if (user.role === 'coach') return 'coach';
  if (user.onboardingStatus !== 'completed') return 'onboarding';
  return hasPlan ? 'home' : 'waiting';
}

export async function getAppState(userId: string, user: AppStateInput): Promise<AppState> {
  // Coaches and unfinished onboarding never need the plan lookup.
  if (user.role === 'coach' || user.onboardingStatus !== 'completed') {
    return resolveAppState(user, false);
  }
  return resolveAppState(user, await hasPublishedPlan(userId));
}
