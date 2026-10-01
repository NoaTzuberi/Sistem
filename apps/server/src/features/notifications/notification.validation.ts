import mongoose from 'mongoose';
import { DEFAULT_NOTIFICATION_PAGE_SIZE, MAX_NOTIFICATION_PAGE_SIZE } from './notification.constants';

export function validateNotificationIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'Invalid notification id.';
  }
  return null;
}

export interface NotificationListQuery {
  limit: number;
  before?: string;
  unreadOnly: boolean;
}

export function parseNotificationListQuery(
  query: Record<string, unknown>,
): { value: NotificationListQuery } | { error: string } {
  let limit = DEFAULT_NOTIFICATION_PAGE_SIZE;
  if (query.limit !== undefined) {
    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_NOTIFICATION_PAGE_SIZE) {
      return { error: `limit must be a whole number between 1 and ${MAX_NOTIFICATION_PAGE_SIZE}.` };
    }
  }

  let before: string | undefined;
  if (query.before !== undefined) {
    if (typeof query.before !== 'string' || !mongoose.isValidObjectId(query.before)) {
      return { error: 'Invalid before cursor.' };
    }
    before = query.before;
  }

  if (query.unread !== undefined && query.unread !== 'true' && query.unread !== 'false') {
    return { error: 'unread must be true or false.' };
  }

  return { value: { limit, before, unreadOnly: query.unread === 'true' } };
}
