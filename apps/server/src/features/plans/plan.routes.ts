import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getMyPlans, getMyPlan } from './plan.controller';

// Trainee side: only the caller's own published plans. The coach reads plans
// through /api/coach/trainees/:traineeId/plans; building/publishing is Phase 6.
export const plansRouter = Router();

plansRouter.use(requireAuth);

plansRouter.get('/', getMyPlans);
plansRouter.get('/:id', getMyPlan);
