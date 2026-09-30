import { Schema, model } from 'mongoose';
import { WORKOUT_STATUS_IDS } from './workout.constants';
import type { WorkoutDocument, WorkoutExerciseEntry, WorkoutSet } from './workout.types';

const setSchema = new Schema<WorkoutSet>(
  {
    setNumber: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
    completed: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const exerciseEntrySchema = new Schema<WorkoutExerciseEntry>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: { type: [setSchema], default: [] },
  },
  { _id: false },
);

const workoutSchema = new Schema<WorkoutDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'WorkoutTemplate', default: null },
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: () => new Date() },
    duration: { type: Number, min: 0, default: undefined },
    status: { type: String, enum: WORKOUT_STATUS_IDS, required: true, default: 'in_progress' },
    exercises: { type: [exerciseEntrySchema], default: [] },
    totalVolume: { type: Number, min: 0, default: undefined },
    rating: { type: Number, min: 1, max: 5, default: undefined },
    notes: { type: String, trim: true, default: undefined },
    photo: { type: String, default: undefined },
  },
  { timestamps: true },
);

workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, status: 1 });

export const Workout = model<WorkoutDocument>('Workout', workoutSchema);
