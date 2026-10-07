import { Schema, model } from 'mongoose';
import type { AchievementDocument } from './achievement.types';

const achievementSchema = new Schema<AchievementDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Definition type from achievement.definitions.ts, e.g. 'workouts_10', 'perfect_week'.
    type: { type: String, required: true, trim: true },
    // Idempotency key: equals `type` for one-time awards and adds a qualifier for
    // repeatable ones (e.g. 'perfect_week:2026-10-04', 'comeback:<logId>').
    key: { type: String, required: true, trim: true },
    value: { type: Number },
    unlockedAt: { type: Date, required: true, default: () => new Date() },
    sourceLogId: { type: Schema.Types.ObjectId, ref: 'WorkoutLog', default: null },
    sourceBodyMetricId: { type: Schema.Types.ObjectId, ref: 'BodyMetric', default: null },
    // When its celebration was shown to her; null = still to celebrate (Phase 11).
    seenAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Never awarded twice.
achievementSchema.index({ traineeId: 1, key: 1 }, { unique: true });
achievementSchema.index({ traineeId: 1, unlockedAt: -1 });
achievementSchema.index({ sourceLogId: 1 });

export const Achievement = model<AchievementDocument>('Achievement', achievementSchema);
