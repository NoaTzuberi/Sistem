import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validatePlanIdParam } from './plan.validation';
import { PlanNotFoundError } from './plan.service';
import { listTraineePlans, getTraineePlan, getTraineeWeek } from './traineePlan.service';
import { sendError } from '../../i18n';

export async function getMyPlans(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await listTraineePlans(req.userId!));
}

/** This week in the trainee's time zone: the plan, each workout's status, the next workout. */
export async function getMyWeek(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await getTraineeWeek(req.userId!));
}

export async function getMyPlan(req: AuthenticatedRequest, res: Response) {
  const validationError = validatePlanIdParam(req.params.id);
  if (validationError) {
    sendError(res, 400, validationError);
    return;
  }

  try {
    const plan = await getTraineePlan(String(req.params.id), req.userId!);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      sendError(res, 404, error.serverMessage);
      return;
    }
    throw error;
  }
}
