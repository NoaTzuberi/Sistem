import type { Types } from 'mongoose';
import type { VariantId } from '../exerciseFamilies/exerciseFamily.constants';
import type {
  Category,
  Muscle,
  Equipment,
  Difficulty,
  MovementType,
  ReviewStatus,
  ContentTier,
  Mechanic,
  ForceType,
  ExerciseGoal,
  TagSource,
} from './exercise.constants';

export interface ExerciseInstructions {
  setup: string;
  execution: string;
  breathing: string;
}

export interface ExerciseSource {
  provider: string;
  dataset: string;
  originalTitle: string | null;
  importedAt: Date;
  license: string | null;
  sourceUrl: string | null;
  /** Untouched original row, kept for traceability and re-review. */
  raw: Record<string, unknown> | null;
}

/** A single styled/posed still image, used by the enhanced-tier gallery. */
export interface ExerciseMediaAsset {
  style: 'flat' | 'classic' | 'classic_white';
  variant: 'start' | 'peak' | 'main';
  url: string;
}

export interface ExerciseMedia {
  image: string | null;
  gif: string | null;
  video: string | null;
  /** Enhanced-tier only: the full multi-style/pose still set. */
  gallery?: ExerciseMediaAsset[];
  /** Enhanced-tier only: looping WebP animation, distinct from `gif`. */
  animationUrl?: string | null;
}

export interface ExerciseDocument {
  slug: string;
  name: string;
  aliases: string[];

  category: Category[];
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];

  equipment: Equipment[];
  difficulty: Difficulty;
  movementType: MovementType;

  instructions: ExerciseInstructions;
  commonMistakes: string[];
  tips: string[];

  progressions: Types.ObjectId[];
  regressions: Types.ObjectId[];
  variations: Types.ObjectId[];
  alternatives: Types.ObjectId[];

  media: ExerciseMedia;
  source: ExerciseSource;

  reviewStatus: ReviewStatus;
  isActive: boolean;

  /** Quality tier — lets any query prefer curated/enhanced records. Default 'standard'. */
  contentTier: ContentTier;
  /** Optional curated metadata; empty for Kaggle (facts-only) records. */
  goals?: ExerciseGoal[];
  mechanic?: Mechanic;
  forceType?: ForceType;
  isUnilateral?: boolean;
  familyId?: Types.ObjectId;
  variant?: VariantId;
  isPrimaryVariant?: boolean;
  familySource?: TagSource;

  createdAt: Date;
  updatedAt: Date;
}

/** Raw CSV row shape for the Kaggle megaGymDataset.csv (leading column is an unnamed pandas index). */
/**
 * The Kaggle CSV columns we are allowed to read. The file also has Desc, Rating
 * and RatingDesc — copied text and ratings that are deliberately NOT typed here so
 * no code can read them (dataset not cleared for commercial use; facts only —
 * see docs/THIRD_PARTY_CONTENT.md).
 */
export interface RawExerciseRow {
  '': string;
  Title: string;
  Type: string;
  BodyPart: string;
  Equipment: string;
  Level: string;
}

export interface NormalizedExercise {
  slug: string;
  name: string;
  aliases: string[];
  category: Category[];
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  difficulty: Difficulty;
  movementType: MovementType;
  instructions: ExerciseInstructions;
  source: ExerciseSource;
  reviewStatus: ReviewStatus;
  isActive: boolean;
  /** normalized title + equipment + primary muscle — the dedup key, not stored on the document */
  dedupKey: string;
}

export interface RowIssue {
  rowIndex: number;
  title: string;
  field: string;
  value: string;
  reason: string;
}

export interface NormalizeResult {
  records: NormalizedExercise[];
  skippedRows: RowIssue[];
  unmappedValues: RowIssue[];
}
