import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { listAchievementsForTrainee } from './achievement.service';

export async function getMyAchievements(req: AuthenticatedRequest, res: Response) {
  const achievements = await listAchievementsForTrainee(req.userId!);
  res.status(200).json({ items: achievements });
}
