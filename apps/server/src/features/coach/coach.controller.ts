import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { listCoachTrainees, getCoachTraineeDetail } from './coach.service';
import { listPlansForTrainee } from '../plans/plan.service';
import { listWorkoutLogsForTrainee } from '../workoutLogs/workoutLog.service';
import { listBodyMetricsForTrainee } from '../bodyMetrics/bodyMetric.service';

export async function getTrainees(req: AuthenticatedRequest, res: Response) {
  const trainees = await listCoachTrainees(req.userId!);
  res.status(200).json({ items: trainees });
}

// Everything below runs after loadCoachTrainee, which set req.traineeId.

export async function getTrainee(req: AuthenticatedRequest, res: Response) {
  const trainee = await getCoachTraineeDetail(req.traineeId!);
  res.status(200).json({ trainee });
}

export async function getTraineePlans(req: AuthenticatedRequest, res: Response) {
  const plans = await listPlansForTrainee(req.traineeId!, { includeDrafts: true });
  res.status(200).json({ items: plans });
}

export async function getTraineeWorkoutLogs(req: AuthenticatedRequest, res: Response) {
  const logs = await listWorkoutLogsForTrainee(req.traineeId!);
  res.status(200).json({ items: logs });
}

export async function getTraineeBodyMetrics(req: AuthenticatedRequest, res: Response) {
  const metrics = await listBodyMetricsForTrainee(req.traineeId!);
  res.status(200).json({ items: metrics });
}
