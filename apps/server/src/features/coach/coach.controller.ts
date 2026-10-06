import { Response } from 'express';
import type { PlanIssuesBody } from '@sistem/types';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { listCoachTrainees, getCoachTraineeDetail } from './coach.service';
import { PlanNotFoundError } from '../plans/plan.service';
import {
  listCoachPlans,
  getCoachPlan,
  createCoachPlan,
  saveCoachPlan,
  publishCoachPlan,
  unpublishCoachPlan,
  deleteCoachPlan,
  PlanValidationError,
  PlanConflictError,
} from '../plans/planBuilder.service';
import { validatePlanIdParam, parseCreatePlanPayload, parseSavePlanPayload } from '../plans/plan.validation';
import { listWorkoutLogsForTrainee } from '../workoutLogs/workoutLog.service';
import { listBodyMetricsForTrainee } from '../bodyMetrics/bodyMetric.service';
import { listCoachExercises } from '../exercises/exercise.service';
import type { ListCoachExercisesParams } from '../exercises/exercise.service';
import { validateExerciseListQuery } from '../exercises/exercise.validation';
import type { Muscle, Equipment, Difficulty } from '../exercises/exercise.constants';
import { listPlanWeekOptions } from '../plans/planWeekOptions.service';

export async function getTrainees(req: AuthenticatedRequest, res: Response) {
  const now = new Date();
  const trainees = await listCoachTrainees(req.userId!, now);
  res.status(200).json({ items: trainees, serverTime: now.toISOString() });
}

/** The plan builder's library: every imported exercise that was not rejected, facts only. */
export async function getExercises(req: AuthenticatedRequest, res: Response) {
  const validationError = validateExerciseListQuery(req.query);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const query = req.query as Record<string, string | undefined>;
  const params: ListCoachExercisesParams = {
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
    muscle: query.muscle as Muscle | undefined,
    equipment: query.equipment as Equipment | undefined,
    difficulty: query.difficulty as Difficulty | undefined,
    search: query.search,
  };
  res.status(200).json(await listCoachExercises(params));
}

// Everything below runs after loadCoachTrainee, which set req.traineeId.

export async function getTrainee(req: AuthenticatedRequest, res: Response) {
  const now = new Date();
  const trainee = await getCoachTraineeDetail(req.traineeId!, now);
  res.status(200).json({ trainee, serverTime: now.toISOString() });
}

export async function getTraineePlans(req: AuthenticatedRequest, res: Response) {
  const plans = await listCoachPlans(req.traineeId!);
  res.status(200).json({ items: plans });
}

/** The weeks a new plan can be made for (this week onwards), with what each one holds. */
export async function getTraineePlanWeeks(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await listPlanWeekOptions(req.traineeId!));
}

export async function getTraineeWorkoutLogs(req: AuthenticatedRequest, res: Response) {
  const logs = await listWorkoutLogsForTrainee(req.traineeId!);
  res.status(200).json({ items: logs });
}

/** Read-only: her weight, measurements and progress photos (signed links made for the coach). */
export async function getTraineeBodyMetrics(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await listBodyMetricsForTrainee(req.traineeId!));
}

// --- Plan builder -----------------------------------------------------------

/** Answers the request for a known plan error; anything else is rethrown (500). */
function sendPlanError(res: Response, error: unknown): void {
  if (error instanceof PlanNotFoundError) {
    res.status(404).json({ message: error.message });
    return;
  }
  if (error instanceof PlanValidationError) {
    const body: PlanIssuesBody = { message: error.message, issues: error.issues };
    res.status(400).json(body);
    return;
  }
  if (error instanceof PlanConflictError) {
    res.status(409).json({ message: error.message });
    return;
  }
  throw error;
}

/** The :planId param, or null after answering 400. */
function readPlanId(req: AuthenticatedRequest, res: Response): string | null {
  const validationError = validatePlanIdParam(req.params.planId);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return null;
  }
  return String(req.params.planId);
}

export async function createTraineePlan(req: AuthenticatedRequest, res: Response) {
  const { value, error } = parseCreatePlanPayload(req.body);
  if (!value) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    const plan = await createCoachPlan(req.traineeId!, req.userId!, value);
    res.status(201).json({ plan });
  } catch (createError) {
    sendPlanError(res, createError);
  }
}

export async function getTraineePlan(req: AuthenticatedRequest, res: Response) {
  const planId = readPlanId(req, res);
  if (!planId) return;

  try {
    res.status(200).json({ plan: await getCoachPlan(req.traineeId!, planId) });
  } catch (error) {
    sendPlanError(res, error);
  }
}

export async function saveTraineePlan(req: AuthenticatedRequest, res: Response) {
  const planId = readPlanId(req, res);
  if (!planId) return;

  const { value, issues } = parseSavePlanPayload(req.body);
  if (!value) {
    const body: PlanIssuesBody = { message: issues[0].message, issues };
    res.status(400).json(body);
    return;
  }

  try {
    res.status(200).json({ plan: await saveCoachPlan(req.traineeId!, planId, value) });
  } catch (error) {
    sendPlanError(res, error);
  }
}

export async function publishTraineePlan(req: AuthenticatedRequest, res: Response) {
  const planId = readPlanId(req, res);
  if (!planId) return;

  try {
    res.status(200).json({ plan: await publishCoachPlan(req.traineeId!, planId) });
  } catch (error) {
    sendPlanError(res, error);
  }
}

export async function unpublishTraineePlan(req: AuthenticatedRequest, res: Response) {
  const planId = readPlanId(req, res);
  if (!planId) return;

  try {
    res.status(200).json({ plan: await unpublishCoachPlan(req.traineeId!, planId) });
  } catch (error) {
    sendPlanError(res, error);
  }
}

export async function deleteTraineePlan(req: AuthenticatedRequest, res: Response) {
  const planId = readPlanId(req, res);
  if (!planId) return;

  try {
    await deleteCoachPlan(req.traineeId!, planId);
    res.status(204).end();
  } catch (error) {
    sendPlanError(res, error);
  }
}
