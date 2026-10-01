import { Schema, model } from 'mongoose';
import type { AchievementDocument } from './achievement.types';

const achievementSchema = new Schema<AchievementDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Definition id from the Phase 11 config, e.g. 'workouts_10', 'personal_record'.
    type: { type: String, required: true, trim: true },
    // Idempotency key: equals `type` for one-time awards and adds a qualifier for
    // repeatable ones (e.g. 'personal_record:<exerciseId>:<weight>').
    key: { type: String, required: true, trim: true },
    value: { type: Number },
    unlockedAt: { type: Date, required: true, default: () => new Date() },
    sourceLogId: { type: Schema.Types.ObjectId, ref: 'WorkoutLog', default: null },
    sourceBodyMetricId: { type: Schema.Types.ObjectId, ref: 'BodyMetric', default: null },
  },
  { timestamps: true },
);

// Never awarded twice.
achievementSchema.index({ traineeId: 1, key: 1 }, { unique: true });
achievementSchema.index({ traineeId: 1, unlockedAt: -1 });

export const Achievement = model<AchievementDocument>('Achievement', achievementSchema);
