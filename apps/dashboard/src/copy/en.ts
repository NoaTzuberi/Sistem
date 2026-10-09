import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  nav: { main: 'Main', trainees: 'Trainees', nutrition: 'Nutrition' },
  loginTitle: 'Coach dashboard',
  email: 'Email',
  password: 'Password',
  loggingIn: 'Logging in…',
  logIn: 'Log in',
  coachOnly: 'This dashboard is for coach accounts only.',
  loginFailed: 'Login failed. Please try again.',
  languageSaveError: "Couldn't save the language. Try again.",
};
