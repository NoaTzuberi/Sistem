// API contract types shared by the mobile app, the coach dashboard and the server.
// Types only — no runtime code, so the server (CommonJS) can use `import type`.

export type UserRole = 'trainee' | 'coach';

/**
 * Where a signed-in user belongs, decided by the server (PRD §4.2).
 * 'onboarding' → questionnaire, 'waiting' → plan is being built, 'home' → trainee
 * Home, 'coach' → coach mode.
 */
export type AppState = 'onboarding' | 'waiting' | 'home' | 'coach';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  appState: AppState;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ApiErrorBody {
  message: string;
}
