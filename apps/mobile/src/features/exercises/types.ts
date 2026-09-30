export type Category = 'upper_body' | 'back' | 'core' | 'lower_body';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MovementType = 'strength' | 'mobility' | 'cardio';
export type ContentTier = 'standard' | 'enhanced';
export type Mechanic = 'compound' | 'isolation';
export type ForceType = 'push' | 'pull' | 'static' | 'dynamic';

export interface ExerciseInstructions {
  setup: string;
  execution: string;
  breathing: string;
}

export interface ExerciseMediaAsset {
  style: 'flat' | 'classic' | 'classic_white';
  variant: 'start' | 'peak' | 'main';
  url: string;
}

export interface ExerciseMediaFields {
  image: string | null;
  gif: string | null;
  video: string | null;
  /** Enhanced-tier only: the full multi-style/pose still set. */
  gallery?: ExerciseMediaAsset[];
  animationUrl?: string | null;
}

export interface PublicExercise {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: Category[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: Difficulty;
  movementType: MovementType;
  instructions: ExerciseInstructions;
  commonMistakes: string[];
  tips: string[];
  media: ExerciseMediaFields;
  contentTier: ContentTier;
  goals?: string[];
  mechanic?: Mechanic;
  forceType?: ForceType;
  isUnilateral?: boolean;
}

export interface PaginatedExercises {
  items: PublicExercise[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExerciseFilterState {
  search: string;
  muscle?: string;
  equipment?: string;
  difficulty?: Difficulty;
  movementType?: MovementType;
}

export const INITIAL_EXERCISE_FILTER_STATE: ExerciseFilterState = {
  search: '',
};
