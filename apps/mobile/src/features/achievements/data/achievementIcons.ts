import type { AchievementType } from '@sistem/types';

// The achievement icons (PRD §12: 3D icons, optional). The owner provides the files.
// TO SWAP: put a file in features/achievements/assets/, import it here and set it as
// that type's image. A type without an image shows the placeholder badge.
//
//   import firstWorkout from '../assets/first-workout.png';
//   first_workout: firstWorkout,

export const ACHIEVEMENT_ICONS: Partial<Record<AchievementType, string>> = {};
