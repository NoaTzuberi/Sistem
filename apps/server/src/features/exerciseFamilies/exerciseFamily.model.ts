import { Schema, model, type Types } from 'mongoose';
import { DIFFICULTY_IDS, MOVEMENT_TYPE_IDS, MUSCLE_IDS, PATTERN_IDS, TAG_SOURCE_IDS } from '../exercises/exercise.constants';
import type { Difficulty, PatternId, TagSource } from '../exercises/exercise.constants';
import { REVIEW_REASON_IDS, type ReviewReason } from './exerciseFamilyGrouping';

// Phase 12b: one movement with its equipment variants. Every Exercise stays its own document
// (plans, logs, PRs and "last time" stay per variant) and points here with familyId. The picker,
// the workout slots and the AI work on families; the coach then picks the variant.

export interface ExerciseFamilyFields {
  /** Grouping key (movement | patterns | type); 'coach:<id>' for a family the coach split off. */
  key: string;
  name: string;
  muscles: string[];
  movementType: string;
  patterns: PatternId[];
  /** 'coach' once she edits name / patterns / membership: the grouping never overwrites it. */
  source: TagSource;
  patternSource: TagSource;
  /** Easiest and hardest level among its primaries (the picker's level filter). */
  levels: { min: Difficulty; max: Difficulty };
  reviewReasons: ReviewReason[];
  reviewedAt: Date | null;
  /** The primaries the coach chose, one per variant; ranked first on every re-run. */
  coachPrimaryIds: Types.ObjectId[];
}

const exerciseFamilySchema = new Schema<ExerciseFamilyFields>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    muscles: { type: [String], enum: MUSCLE_IDS, default: [] },
    movementType: { type: String, enum: MOVEMENT_TYPE_IDS, required: true },
    patterns: { type: [String], enum: PATTERN_IDS, default: [] },
    source: { type: String, enum: TAG_SOURCE_IDS, required: true, default: 'auto' },
    patternSource: { type: String, enum: TAG_SOURCE_IDS, required: true, default: 'auto' },
    levels: {
      min: { type: String, enum: DIFFICULTY_IDS, required: true },
      max: { type: String, enum: DIFFICULTY_IDS, required: true },
    },
    reviewReasons: { type: [String], enum: REVIEW_REASON_IDS, default: [] },
    reviewedAt: { type: Date, default: null },
    coachPrimaryIds: { type: [Schema.Types.ObjectId], ref: 'Exercise', default: [] },
  },
  { timestamps: true },
);

exerciseFamilySchema.index({ patterns: 1 });
exerciseFamilySchema.index({ reviewReasons: 1, reviewedAt: 1 });

export const ExerciseFamily = model<ExerciseFamilyFields>('ExerciseFamily', exerciseFamilySchema);
