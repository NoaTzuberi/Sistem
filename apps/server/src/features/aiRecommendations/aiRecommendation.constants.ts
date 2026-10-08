import type { AiRecommendationStatus, AiRecommendationTrigger, AiRecommendationType } from '@sistem/types';

// Each type has its kind in aiRecommendation.service.ts KINDS.
export const AI_RECOMMENDATION_TYPE_IDS = ['training_plan', 'nutrition_plan'] as const satisfies readonly AiRecommendationType[];

export const AI_RECOMMENDATION_STATUS_IDS = ['pending', 'running', 'ready', 'failed'] as const satisfies readonly AiRecommendationStatus[];

export const AI_RECOMMENDATION_TRIGGER_IDS = ['onboarding', 'coach'] as const satisfies readonly AiRecommendationTrigger[];

/** Error codes of a failed recommendation, on top of the provider's (AiErrorCode). */
export const RECOMMENDATION_ERROR = {
  invalidOutput: 'invalid_output',
  notEnoughData: 'not_enough_data',
  interrupted: 'interrupted',
  internal: 'internal',
} as const;
