import { Schema, model, type Types } from 'mongoose';
import type { TrainingSettingsPayload } from '@sistem/types';

// A coach's own training config (Phase 12b): slot lists per workout type and split changes.
// Unset parts fall back to the defaults (trainingSplit.config.ts) — getEffectiveTrainingConfig().
// The editing screen comes later (backlog); the API already stores and merges it.

export interface TrainingSettingsFields {
  coachId: Types.ObjectId;
  workoutTypes: NonNullable<TrainingSettingsPayload['workoutTypes']>;
  splits: NonNullable<TrainingSettingsPayload['splits']>;
}

const trainingSettingsSchema = new Schema<TrainingSettingsFields>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Validated by parseTrainingSettingsPayload before it is stored.
    workoutTypes: { type: Schema.Types.Mixed, default: {} },
    splits: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export const TrainingSettings = model<TrainingSettingsFields>('TrainingSettings', trainingSettingsSchema);
