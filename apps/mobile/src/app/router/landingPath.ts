import type { AppState } from '@sistem/types';
import { ROUTES } from '../config/routes';

// Where each server-decided app state lands (PRD §4.2). 'waiting' uses the kept
// DashboardPage until the Phase 4 waiting screen replaces it (owner decision).
const LANDING_PATHS: Record<AppState, string> = {
  onboarding: ROUTES.ONBOARDING,
  waiting: ROUTES.DASHBOARD,
  home: ROUTES.TRAINEE_HOME,
  coach: ROUTES.COACH_INBOX,
};

export function landingPath(appState: AppState): string {
  return LANDING_PATHS[appState];
}
