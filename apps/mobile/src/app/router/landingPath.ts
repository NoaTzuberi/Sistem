import type { AppState } from '@sistem/types';
import { ROUTES } from '../config/routes';

// Where each server-decided app state lands (PRD §4.2).
const LANDING_PATHS: Record<AppState, string> = {
  onboarding: ROUTES.ONBOARDING,
  waiting: ROUTES.WAITING,
  home: ROUTES.TRAINEE_HOME,
  coach: ROUTES.COACH_INBOX,
};

export function landingPath(appState: AppState): string {
  return LANDING_PATHS[appState];
}
