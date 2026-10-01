import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { parseNotificationListQuery, validateNotificationIdParam } from './notification.validation';
import {
  listNotifications,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationNotFoundError,
} from './notification.service';

export async function getMyNotifications(req: AuthenticatedRequest, res: Response) {
  const parsed = parseNotificationListQuery(req.query as Record<string, unknown>);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error });
    return;
  }

  const list = await listNotifications(req.userId!, parsed.value);
  res.status(200).json(list);
}

export async function getMyUnreadCount(req: AuthenticatedRequest, res: Response) {
  const unreadCount = await countUnreadNotifications(req.userId!);
  res.status(200).json({ unreadCount });
}

export async function markMyNotificationRead(req: AuthenticatedRequest, res: Response) {
  const validationError = validateNotificationIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const notification = await markNotificationRead(req.userId!, String(req.params.id));
    res.status(200).json({ notification });
  } catch (error) {
    if (error instanceof NotificationNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function markAllMyNotificationsRead(req: AuthenticatedRequest, res: Response) {
  await markAllNotificationsRead(req.userId!);
  res.status(200).json({ unreadCount: 0 });
}
