import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getMyNutritionPlan } from './nutrition.controller';

// Trainee side: only her own newest published version. The coach builds through
// /api/coach (food list, settings, templates, and /trainees/:traineeId/nutrition-plan).
export const nutritionRouter = Router();

nutritionRouter.use(requireAuth, requireRole('trainee'));

nutritionRouter.get('/', getMyNutritionPlan);
