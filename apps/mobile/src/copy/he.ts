import { plural } from '@sistem/shared';

// The mobile app's own texts that belong to no feature (tab bar, shell). Hebrew = primary;
// DRAFT translations for the owner's review (phase-15 report).
export const he = {
  tabs: {
    home: 'בית',
    workouts: 'אימונים',
    nutrition: 'תזונה',
    profile: 'פרופיל',
    inbox: 'הודעות',
    trainees: 'מתאמנות',
    navigation: 'ראשי',
  },
  comingSoon: 'בקרוב.',
  unread: plural({ one: 'התראה אחת שלא נקראה', two: '2 התראות שלא נקראו', other: '{count} התראות שלא נקראו' }),
} as const;
