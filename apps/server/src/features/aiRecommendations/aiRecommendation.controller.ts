import type { Response } from 'express';
import type { AiRecommendationLatest } from '@sistem/types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { aiUnavailableReason } from '../ai/ai.config';
import {
  getLatestRecommendation,
  getRecommendation,
  presentRecommendation,
  startRecommendation,
} from './aiRecommendation.service';
import { parseRecommendationType, validateRecommendationIdParam } from './aiRecommendation.validation';

// Coach-only (mounted on /api/coach behind requireRole('coach') + loadCoachTrainee).
// No trainee route reads recommendations: an AI draft reaches her only as a plan the
// coach saved and published.

const TYPE_ERROR = 'type must be one of: training_plan.';

export async function getLatestTraineeRecommendation(req: AuthenticatedRequest, res: Response) {
  const type = parseRecommendationType(req.query.type ?? 'training_plan');
  if (!type) {
    res.status(400).json({ message: TYPE_ERROR });
    return;
  }
  const body: AiRecommendationLatest = {
    recommendation: await getLatestRecommendation(req.traineeId!, type),
    unavailableReason: aiUnavailableReason(),
  };
  res.status(200).json(body);
}

export async function getTraineeRecommendation(req: AuthenticatedRequest, res: Response) {
  const validationError = validateRecommendationIdParam(req.params.recommendationId);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }
  const recommendation = await getRecommendation(req.traineeId!, String(req.params.recommendationId));
  if (!recommendation) {
    res.status(404).json({ message: 'Recommendation not found.' });
    return;
  }
  res.status(200).json({ recommendation });
}

/** Generate / Regenerate. 202: started in the background; poll …/latest for the result. */
export async function createTraineeRecommendation(req: AuthenticatedRequest, res: Response) {
  const type = parseRecommendationType(req.body?.type);
  if (!type) {
    res.status(400).json({ message: TYPE_ERROR });
    return;
  }
  const unavailable = aiUnavailableReason();
  if (unavailable) {
    res.status(503).json({ message: unavailable });
    return;
  }

  const started = await startRecommendation({ traineeId: req.traineeId!, coachId: req.userId!, type, trigger: 'coach' });
  const recommendation = await presentRecommendation(started.recommendation);
  if (!started.created) {
    res.status(409).json({ message: 'A draft is already being generated for this trainee.', recommendation });
    return;
  }
  res.status(202).json({ recommendation });
}
