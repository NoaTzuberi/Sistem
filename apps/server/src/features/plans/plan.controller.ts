import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validatePlanIdParam } from './plan.validation';
import { listPlansForTrainee, getPublishedPlanForTrainee, PlanNotFoundError } from './plan.service';

export async function getMyPlans(req: AuthenticatedRequest, res: Response) {
  const plans = await listPlansForTrainee(req.userId!, { includeDrafts: false });
  res.status(200).json({ items: plans });
}

export async function getMyPlan(req: AuthenticatedRequest, res: Response) {
  const validationError = validatePlanIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const plan = await getPublishedPlanForTrainee(String(req.params.id), req.userId!);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}
