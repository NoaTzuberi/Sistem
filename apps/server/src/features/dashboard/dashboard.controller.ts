import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getDashboardSummary } from './dashboard.service';

export async function getSummary(req: AuthenticatedRequest, res: Response) {
  const summary = await getDashboardSummary(req.userId!);
  res.status(200).json(summary);
}
