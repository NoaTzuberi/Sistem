import { plural, type CopyShape } from '@sistem/shared';
import type { he } from './he';

export const en: CopyShape<typeof he> = {
  tabs: {
    home: 'Home',
    workouts: 'Workouts',
    nutrition: 'Nutrition',
    profile: 'Profile',
    inbox: 'Inbox',
    trainees: 'Trainees',
    navigation: 'Main',
  },
  comingSoon: 'Coming soon.',
  unread: plural({ one: '{count} unread', other: '{count} unread' }),
};
