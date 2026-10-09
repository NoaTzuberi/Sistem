import type { sharedCopy } from '@sistem/shared';

export type ActivityCategoryId =
  | 'strength_training'
  | 'cardio_endurance'
  | 'mind_mobility_recovery'
  | 'combat_sports'
  | 'outdoor_board_sports'
  | 'team_racquet_sports'
  | 'other';

// Labels live in the shared copy (onboardingOptions.activityCategories / .activities) by id
// (Phase 15) — the ids and this list are unchanged.
export interface ActivityCategory {
  id: ActivityCategoryId;
}

export interface Activity {
  id: ActivityId;
  emoji: string;
  category: ActivityCategoryId;
}

export type ActivityId = keyof (typeof sharedCopy)['he']['onboardingOptions']['activities'];

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: 'strength_training' },
  { id: 'cardio_endurance' },
  { id: 'mind_mobility_recovery' },
  { id: 'combat_sports' },
  { id: 'outdoor_board_sports' },
  { id: 'team_racquet_sports' },
  { id: 'other' },
];

export const ACTIVITIES: Activity[] = [
  // Strength & training
  { id: 'gym_strength_training', emoji: '🏋️', category: 'strength_training' },
  { id: 'calisthenics', emoji: '🤸', category: 'strength_training' },
  { id: 'functional_training', emoji: '🏃', category: 'strength_training' },
  { id: 'crossfit', emoji: '🏋️', category: 'strength_training' },

  // Cardio & endurance
  { id: 'running', emoji: '🏃', category: 'cardio_endurance' },
  { id: 'cycling', emoji: '🚴', category: 'cardio_endurance' },
  { id: 'swimming', emoji: '🏊', category: 'cardio_endurance' },
  { id: 'rowing', emoji: '🚣', category: 'cardio_endurance' },
  { id: 'hiking', emoji: '🥾', category: 'cardio_endurance' },
  { id: 'jump_rope', emoji: '🪢', category: 'cardio_endurance' },

  // Mind, mobility & recovery
  { id: 'yoga', emoji: '🧘', category: 'mind_mobility_recovery' },
  { id: 'pilates', emoji: '🤸', category: 'mind_mobility_recovery' },
  { id: 'mobility', emoji: '🧎', category: 'mind_mobility_recovery' },
  { id: 'dance', emoji: '💃', category: 'mind_mobility_recovery' },

  // Combat sports
  { id: 'boxing', emoji: '🥊', category: 'combat_sports' },
  { id: 'martial_arts', emoji: '🥋', category: 'combat_sports' },
  { id: 'brazilian_jiu_jitsu', emoji: '🤼', category: 'combat_sports' },
  { id: 'muay_thai', emoji: '🥊', category: 'combat_sports' },

  // Outdoor & board sports
  { id: 'surfing', emoji: '🏄', category: 'outdoor_board_sports' },
  { id: 'skateboarding', emoji: '🛹', category: 'outdoor_board_sports' },
  { id: 'climbing', emoji: '🧗', category: 'outdoor_board_sports' },
  { id: 'skiing', emoji: '⛷️', category: 'outdoor_board_sports' },
  { id: 'snowboarding', emoji: '🏂', category: 'outdoor_board_sports' },

  // Team & racquet sports
  { id: 'football_soccer', emoji: '⚽', category: 'team_racquet_sports' },
  { id: 'basketball', emoji: '🏀', category: 'team_racquet_sports' },
  { id: 'tennis', emoji: '🎾', category: 'team_racquet_sports' },
  { id: 'volleyball', emoji: '🏐', category: 'team_racquet_sports' },
  { id: 'table_tennis', emoji: '🏓', category: 'team_racquet_sports' },
  { id: 'badminton', emoji: '🏸', category: 'team_racquet_sports' },
  { id: 'rugby', emoji: '🏉', category: 'team_racquet_sports' },

  // Other
  { id: 'other_activity', emoji: '✨', category: 'other' },
];
