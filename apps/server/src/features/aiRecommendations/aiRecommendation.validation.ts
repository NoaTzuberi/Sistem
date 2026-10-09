import mongoose from 'mongoose';
import type { AiRecommendationType } from '@sistem/types';
import { AI_RECOMMENDATION_TYPE_IDS } from './aiRecommendation.constants';
import { type ServerMessage, msg } from '../../i18n';

export function parseRecommendationType(value: unknown): AiRecommendationType | null {
  return typeof value === 'string' && (AI_RECOMMENDATION_TYPE_IDS as readonly string[]).includes(value)
    ? (value as AiRecommendationType)
    : null;
}

export function validateRecommendationIdParam(id: unknown): ServerMessage | null {
  return typeof id === 'string' && mongoose.isValidObjectId(id) ? null : msg('ai_recommendation_id_invalid');
}
