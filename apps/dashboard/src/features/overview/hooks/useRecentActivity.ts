import type { AppNotification } from '@sistem/types';
import { useLoad } from '@sistem/shared';
import { listNotifications } from '../../../services/notifications/notificationsService';

const FEED_LIMIT = 8;
// useLoad wants a message; the feed words its own (the inbox's existing line).
const FAILED = 'failed';
const loadFeed = () => listNotifications({ limit: FEED_LIMIT }).then((list) => list.items);

/** The coach's latest notifications — the Overview's activity feed is the same list as the bell's. */
export function useRecentActivity(): { items: AppNotification[] | undefined; hasError: boolean; reload: () => void } {
  const { data, error, reload } = useLoad(loadFeed, FAILED);
  return { items: data, hasError: error !== undefined, reload };
}
