import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getAchievementOverview, markAchievementsSeen } from './achievement.service';
import { parseMarkSeenPayload } from './achievement.validation';
import { sendError } from '../../i18n';

export async function getMyAchievements(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await getAchievementOverview(req.userId!));
}

export async function postAchievementsSeen(req: AuthenticatedRequest, res: Response) {
  const parsed = parseMarkSeenPayload(req.body);
  if (parsed.error !== undefined) {
    sendError(res, 400, parsed.error);
    return;
  }
  await markAchievementsSeen(req.userId!, parsed.value);
  res.status(204).end();
}
