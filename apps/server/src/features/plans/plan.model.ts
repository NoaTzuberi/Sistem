import { Schema, model } from 'mongoose';
import { PLAN_STATUS_IDS, DEFAULT_PLAN_STATUS } from './plan.constants';
import { planWorkoutSchema } from './planWorkout.schema';
import { isSunday } from './planWeek';
import type { PlanDocument } from './plan.types';

const planSchema = new Schema<PlanDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Copied from the trainee when the plan is created.
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // 'YYYY-MM-DD' of the Sunday that starts the week, in the trainee's time zone.
    weekStartDate: {
      type: String,
      required: true,
      validate: { validator: isSunday, message: 'weekStartDate must be a Sunday (YYYY-MM-DD).' },
    },
    status: { type: String, enum: PLAN_STATUS_IDS, required: true, default: DEFAULT_PLAN_STATUS },
    publishedAt: { type: Date, default: null },
    // When the trainee's view of this plan last changed: publish, or a save while published
    // (the Workouts tab dot, Phase 13a). Unset on plans from before 13a → publishedAt.
    liveUpdatedAt: { type: Date, default: null },
    notes: { type: String, trim: true },
    workouts: { type: [planWorkoutSchema], default: [] },
    // The AI recommendation the coach loaded into this plan (Phase 12) — coach-only, so the
    // builder can show its rationale. Never copied by "duplicate last week".
    aiRecommendationId: { type: Schema.Types.ObjectId, ref: 'AiRecommendation', default: undefined },
    // Phase 12b (coach-only): the split the plan follows.
    splitId: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

// One plan per trainee per week: a draft becomes published in place.
planSchema.index({ traineeId: 1, weekStartDate: 1 }, { unique: true });
planSchema.index({ traineeId: 1, status: 1, weekStartDate: -1 });
planSchema.index({ coachId: 1, status: 1, weekStartDate: -1 });

export const Plan = model<PlanDocument>('Plan', planSchema);
