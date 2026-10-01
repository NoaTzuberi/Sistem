import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { listBodyMetricsForTrainee } from './bodyMetric.service';

export async function getMyBodyMetrics(req: AuthenticatedRequest, res: Response) {
  const metrics = await listBodyMetricsForTrainee(req.userId!);
  res.status(200).json({ items: metrics });
}
