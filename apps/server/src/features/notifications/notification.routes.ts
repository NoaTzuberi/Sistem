import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  getMyNotifications,
  getMyUnreadCount,
  markMyNotificationRead,
  markAllMyNotificationsRead,
} from './notification.controller';

// Both roles: every call is scoped to the caller's own notifications. They are
// only ever created by the server (notify()), never through the API.
export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', getMyNotifications);
notificationsRouter.get('/unread-count', getMyUnreadCount);
notificationsRouter.post('/read-all', markAllMyNotificationsRead);
notificationsRouter.patch('/:id/read', markMyNotificationRead);
