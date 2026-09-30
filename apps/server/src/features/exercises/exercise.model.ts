import { Schema, model } from 'mongoose';
import {
  CATEGORY_IDS,
  MUSCLE_IDS,
  EQUIPMENT_IDS,
  DIFFICULTY_IDS,
  MOVEMENT_TYPE_IDS,
  REVIEW_STATUS_IDS,
  CONTENT_TIER_IDS,
  MECHANIC_IDS,
  FORCE_TYPE_IDS,
  EXERCISE_GOAL_IDS,
} from './exercise.constants';
import type {
  ExerciseDocument,
  ExerciseInstructions,
  ExerciseSource,
  ExerciseMedia,
  ExerciseMediaAsset,
} from './exercise.types';

const instructionsSchema = new Schema<ExerciseInstructions>(
  {
    setup: { type: String, default: '', trim: true },
    execution: { type: String, default: '', trim: true },
    breathing: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const sourceSchema = new Schema<ExerciseSource>(
  {
    provider: { type: String, required: true },
    dataset: { type: String, required: true },
    originalTitle: { type: String, default: null },
    importedAt: { type: Date, required: true },
    license: { type: String, default: null },
    sourceUrl: { type: String, default: null },
    raw: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const mediaAssetSchema = new Schema<ExerciseMediaAsset>(
  {
    style: { type: String, enum: ['flat', 'classic', 'classic_white'], required: true },
    variant: { type: String, enum: ['start', 'peak', 'main'], required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const mediaSchema = new Schema<ExerciseMedia>(
  {
    image: { type: String, default: null },
    gif: { type: String, default: null },
    video: { type: String, default: null },
    gallery: { type: [mediaAssetSchema], default: undefined },
    animationUrl: { type: String, default: null },
  },
  { _id: false },
);

const exerciseSchema = new Schema<ExerciseDocument>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },

    category: { type: [String], enum: CATEGORY_IDS, default: [] },
    primaryMuscles: { type: [String], enum: MUSCLE_IDS, default: [] },
    secondaryMuscles: { type: [String], enum: MUSCLE_IDS, default: [] },

    equipment: { type: [String], enum: EQUIPMENT_IDS, default: [] },
    difficulty: { type: String, enum: DIFFICULTY_IDS, required: true },
    movementType: { type: String, enum: MOVEMENT_TYPE_IDS, required: true },

    instructions: { type: instructionsSchema, default: () => ({}) },
    commonMistakes: { type: [String], default: [] },
    tips: { type: [String], default: [] },

    progressions: { type: [Schema.Types.ObjectId], ref: 'Exercise', default: [] },
    regressions: { type: [Schema.Types.ObjectId], ref: 'Exercise', default: [] },
    variations: { type: [Schema.Types.ObjectId], ref: 'Exercise', default: [] },
    alternatives: { type: [Schema.Types.ObjectId], ref: 'Exercise', default: [] },

    media: { type: mediaSchema, default: () => ({}) },
    source: { type: sourceSchema, required: true },

    reviewStatus: { type: String, enum: REVIEW_STATUS_IDS, required: true, default: 'imported' },
    isActive: { type: Boolean, required: true, default: true },

    contentTier: { type: String, enum: CONTENT_TIER_IDS, required: true, default: 'standard' },
    goals: { type: [String], enum: EXERCISE_GOAL_IDS, default: undefined },
    mechanic: { type: String, enum: MECHANIC_IDS, default: undefined },
    forceType: { type: String, enum: FORCE_TYPE_IDS, default: undefined },
    isUnilateral: { type: Boolean, default: undefined },
  },
  { timestamps: true },
);

exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ primaryMuscles: 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ movementType: 1 });
exerciseSchema.index({ reviewStatus: 1 });
exerciseSchema.index({ contentTier: 1 });
exerciseSchema.index({ goals: 1 });

export const Exercise = model<ExerciseDocument>('Exercise', exerciseSchema);
