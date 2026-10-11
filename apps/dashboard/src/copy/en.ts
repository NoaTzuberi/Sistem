import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  nav: { main: 'Main', trainees: 'Trainees', nutrition: 'Nutrition', exercises: 'Exercises' },
  email: 'Email',
  password: 'Password',
  loggingIn: 'Logging in…',
  // PLACEHOLDER English (the owner sent Hebrew), except the headline "Your Sisterhood.".
  login: {
    badge: 'COACH',
    headlineBefore: 'Your ',
    headlineAfter: '.',
    sub: 'Manage trainees, build plans and track progress. All in one place.',
    features: {
      trainees: { title: 'Trainees', caption: 'All your trainees' },
      plans: { title: 'Plans', caption: 'Weekly training plans' },
      nutrition: { title: 'Nutrition', caption: 'Nutrition plans' },
    },
    title: 'Coach login',
    subtitle: 'Log in to manage your trainees',
    forgot: 'Forgot?',
    rememberMe: 'Keep me signed in',
    submit: 'Enter the dashboard',
    traineePrompt: 'Trainee?',
    traineeLink: 'Your login is in the app',
  },
  coachOnly: 'This dashboard is for coach accounts only.',
  loginFailed: 'Login failed. Please try again.',
  languageSaveError: "Couldn't save the language. Try again.",
};
