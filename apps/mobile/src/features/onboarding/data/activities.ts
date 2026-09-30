export type ActivityCategoryId =
  | 'strength_training'
  | 'cardio_endurance'
  | 'mind_mobility_recovery'
  | 'combat_sports'
  | 'outdoor_board_sports'
  | 'team_racquet_sports'
  | 'other';

export interface ActivityCategory {
  id: ActivityCategoryId;
  label: string;
}

export interface Activity {
  id: string;
  label: string;
  emoji: string;
  category: ActivityCategoryId;
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: 'strength_training', label: 'Strength & training' },
  { id: 'cardio_endurance', label: 'Cardio & endurance' },
  { id: 'mind_mobility_recovery', label: 'Mind, mobility & recovery' },
  { id: 'combat_sports', label: 'Combat sports' },
  { id: 'outdoor_board_sports', label: 'Outdoor & board sports' },
  { id: 'team_racquet_sports', label: 'Team & racquet sports' },
  { id: 'other', label: 'Other' },
];

export const ACTIVITIES: Activity[] = [
  // Strength & training
  { id: 'gym_strength_training', label: 'Gym / Strength Training', emoji: '🏋️', category: 'strength_training' },
  { id: 'calisthenics', label: 'Calisthenics', emoji: '🤸', category: 'strength_training' },
  { id: 'functional_training', label: 'Functional Training', emoji: '🏃', category: 'strength_training' },
  { id: 'crossfit', label: 'CrossFit', emoji: '🏋️', category: 'strength_training' },

  // Cardio & endurance
  { id: 'running', label: 'Running', emoji: '🏃', category: 'cardio_endurance' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴', category: 'cardio_endurance' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', category: 'cardio_endurance' },
  { id: 'rowing', label: 'Rowing', emoji: '🚣', category: 'cardio_endurance' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾', category: 'cardio_endurance' },
  { id: 'jump_rope', label: 'Jump Rope', emoji: '🪢', category: 'cardio_endurance' },

  // Mind, mobility & recovery
  { id: 'yoga', label: 'Yoga', emoji: '🧘', category: 'mind_mobility_recovery' },
  { id: 'pilates', label: 'Pilates', emoji: '🤸', category: 'mind_mobility_recovery' },
  { id: 'mobility', label: 'Mobility', emoji: '🧎', category: 'mind_mobility_recovery' },
  { id: 'dance', label: 'Dance', emoji: '💃', category: 'mind_mobility_recovery' },

  // Combat sports
  { id: 'boxing', label: 'Boxing', emoji: '🥊', category: 'combat_sports' },
  { id: 'martial_arts', label: 'Martial Arts', emoji: '🥋', category: 'combat_sports' },
  { id: 'brazilian_jiu_jitsu', label: 'Brazilian Jiu-Jitsu', emoji: '🤼', category: 'combat_sports' },
  { id: 'muay_thai', label: 'Muay Thai', emoji: '🥊', category: 'combat_sports' },

  // Outdoor & board sports
  { id: 'surfing', label: 'Surfing', emoji: '🏄', category: 'outdoor_board_sports' },
  { id: 'skateboarding', label: 'Skateboarding', emoji: '🛹', category: 'outdoor_board_sports' },
  { id: 'climbing', label: 'Climbing', emoji: '🧗', category: 'outdoor_board_sports' },
  { id: 'skiing', label: 'Skiing', emoji: '⛷️', category: 'outdoor_board_sports' },
  { id: 'snowboarding', label: 'Snowboarding', emoji: '🏂', category: 'outdoor_board_sports' },

  // Team & racquet sports
  { id: 'football_soccer', label: 'Football / Soccer', emoji: '⚽', category: 'team_racquet_sports' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', category: 'team_racquet_sports' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', category: 'team_racquet_sports' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐', category: 'team_racquet_sports' },
  { id: 'table_tennis', label: 'Table Tennis', emoji: '🏓', category: 'team_racquet_sports' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', category: 'team_racquet_sports' },
  { id: 'rugby', label: 'Rugby', emoji: '🏉', category: 'team_racquet_sports' },

  // Other
  { id: 'other_activity', label: 'Other activity', emoji: '✨', category: 'other' },
];
