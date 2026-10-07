import { Schema, model } from 'mongoose';
import {
  AI_RECOMMENDATION_STATUS_IDS,
  AI_RECOMMENDATION_TRIGGER_IDS,
  AI_RECOMMENDATION_TYPE_IDS,
} from './aiRecommendation.constants';
import type { AiRecommendationDocument, RecommendationAttempt } from './aiRecommendation.types';

// PRD §10 "AIRecommendation": one generic model for every AI draft the coach reviews
// (training plan now, nutrition plan in Phase 13c). The output's shape belongs to its type.

const attemptSchema = new Schema<RecommendationAttempt>(
  {
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    model: { type: String, default: null },
    finish: { type: String, default: null },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    thinkingTokens: { type: Number, default: 0 },
    issues: { type: [String], default: [] },
    error: { type: String, default: null },
    fallbackReason: { type: String, default: null },
  },
  { _id: false },
);

const aiRecommendationSchema = new Schema<AiRecommendationDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: AI_RECOMMENDATION_TYPE_IDS, required: true },
    status: { type: String, enum: AI_RECOMMENDATION_STATUS_IDS, required: true, default: 'pending' },
    trigger: { type: String, enum: AI_RECOMMENDATION_TRIGGER_IDS, required: true },
    active: { type: Boolean, required: true, default: true },
    promptVersion: { type: String, default: null },
    input: { type: Schema.Types.Mixed, default: null },
    output: { type: Schema.Types.Mixed, default: null },
    model: { type: String, default: null },
    attempts: { type: [attemptSchema], default: [] },
    error: { type: new Schema({ code: String, message: String }, { _id: false }), default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

aiRecommendationSchema.index({ traineeId: 1, type: 1, createdAt: -1 });
// One run at a time per trainee and type: a second start while one is active fails here.
aiRecommendationSchema.index(
  { traineeId: 1, type: 1 },
  { unique: true, partialFilterExpression: { active: true }, name: 'one_active_per_trainee_type' },
);

export const AiRecommendation = model<AiRecommendationDocument>('AiRecommendation', aiRecommendationSchema);
