import type { AppState, UserRole } from '@sistem/types';

interface AppStateInput {
  role: UserRole;
  onboardingCompleted: boolean;
}

/**
 * Decides where a signed-in user lands (PRD §4.2). The client only follows this
 * value — it never derives the state itself.
 */
export function resolveAppState(user: AppStateInput, hasPublishedPlan: boolean): AppState {
  if (user.role === 'coach') return 'coach';
  if (!user.onboardingCompleted) return 'onboarding';
  return hasPublishedPlan ? 'home' : 'waiting';
}

/**
 * The Plan model arrives in Phase 3; until then no trainee can have a published
 * plan, so every onboarded trainee resolves to 'waiting'. Phase 3 replaces this
 * with a real Plan lookup (status 'published', traineeId = userId).
 */
export async function hasPublishedPlan(_userId: string): Promise<boolean> {
  return false;
}

export async function getAppState(userId: string, user: AppStateInput): Promise<AppState> {
  // Coaches and unfinished onboarding never need the plan lookup.
  if (user.role === 'coach' || !user.onboardingCompleted) {
    return resolveAppState(user, false);
  }
  return resolveAppState(user, await hasPublishedPlan(userId));
}
