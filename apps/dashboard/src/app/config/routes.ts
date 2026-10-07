export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  TRAINEES: '/trainees',
  TRAINEE: '/trainees/:traineeId',
  PLAN: '/trainees/:traineeId/plans/:planId',
} as const;

export const TRAINEE_TABS = ['onboarding', 'plans', 'logs', 'metrics', 'achievements'] as const;
export type TraineeTab = (typeof TRAINEE_TABS)[number];
export const DEFAULT_TRAINEE_TAB: TraineeTab = 'onboarding';
/** The trainee page keeps its open tab in the URL, so links can point at one. */
export const TRAINEE_TAB_PARAM = 'tab';

export function traineePath(traineeId: string, tab?: TraineeTab): string {
  const path = `${ROUTES.TRAINEES}/${traineeId}`;
  return tab && tab !== DEFAULT_TRAINEE_TAB ? `${path}?${TRAINEE_TAB_PARAM}=${tab}` : path;
}

export function planPath(traineeId: string, planId: string): string {
  return `${ROUTES.TRAINEES}/${traineeId}/plans/${planId}`;
}
