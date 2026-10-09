import { Response } from 'express';
import type { UpdateTab } from '@sistem/types';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UPDATE_TABS, getTabUpdates, markTabSeen } from './tabUpdates.service';
import { sendError } from '../../i18n';

export async function getMyTabUpdates(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await getTabUpdates(req.userId!));
}

export async function postTabSeen(req: AuthenticatedRequest, res: Response) {
  const tab: unknown = req.body?.tab;
  if (!(UPDATE_TABS as readonly unknown[]).includes(tab)) {
    sendError(res, 400, 'tab_invalid');
    return;
  }
  res.status(200).json(await markTabSeen(req.userId!, tab as UpdateTab));
}
