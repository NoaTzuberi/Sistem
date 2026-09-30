import { Schema, model } from 'mongoose';
import { DIFFICULTY_IDS } from '../exercises/exercise.constants';
import { WORKOUT_CATEGORY_IDS, WORKOUT_GOAL_IDS } from './workoutTemplate.constants';
import type { WorkoutTemplateDocument, WorkoutTemplateExerciseEntry } from './workoutTemplate.types';

const exerciseEntrySchema = new Schema<WorkoutTemplateExerciseEntry>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    order: { type: Number, required: true, min: 0 },
    defaultSets: { type: Number, required: true, min: 1 },
    defaultReps: { type: String, required: true, trim: true },
    defaultWeight: { type: Number, min: 0, default: undefined },
    restTime: { type: Number, min: 0, default: undefined },
  },
  { _id: false },
);

const workoutTemplateSchema = new Schema<WorkoutTemplateDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    goal: { type: [String], enum: WORKOUT_GOAL_IDS, default: [] },
    difficulty: { type: String, enum: DIFFICULTY_IDS, default: undefined },
    duration: { type: Number, min: 1, default: undefined },
    category: { type: String, enum: WORKOUT_CATEGORY_IDS, default: undefined },
    exercises: { type: [exerciseEntrySchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

workoutTemplateSchema.index({ createdBy: 1 });
workoutTemplateSchema.index({ category: 1 });

export const WorkoutTemplate = model<WorkoutTemplateDocument>('WorkoutTemplate', workoutTemplateSchema);
