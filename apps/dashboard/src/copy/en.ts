import type { CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  nav: {
    main: 'Main',
    trainees: 'Trainees',
    nutrition: 'Nutrition',
    training: 'Training',
    overview: 'Overview',
    stats: 'Statistics',
    allTrainees: 'All trainees',
    waiting: 'Waiting for a plan',
  },
  shell: {
    collapse: 'Collapse the menu',
    expand: 'Expand the menu',
    menu: 'Menu',
    search: 'Search',
    coach: 'Coach',
    badge: '{label}, {count}',
  },
  palette: {
    placeholder: 'Search a trainee, a screen or an action',
    pickTrainee: 'New plan — for which trainee?',
    empty: 'Nothing found. Try a trainee or a screen name.',
    screens: 'Screens',
    actions: 'Actions',
  },
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
