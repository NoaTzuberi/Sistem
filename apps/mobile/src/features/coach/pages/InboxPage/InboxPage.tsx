import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '@sistem/types';
import { describeCoachNotification, formatDateTime } from '@sistem/shared';
import { IconChevronRight } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { listNotifications, markAllRead, markRead } from '../../../../services/notifications/notificationsService';
import { refreshUnreadCount, setUnreadCount, useUnreadCount } from '../../../notifications/unreadCount';
import { coachTraineePath } from '../../../../app/config/routes';
import { CoachMessage } from '../../components/CoachMessage/CoachMessage';
import './InboxPage.css';

const PAGE_SIZE = 20;

// Coach mode Inbox (PRD §6): the in-app notifications of Phase 5a. Push (Phase 5b)
// will open the same targets.
export function InboxPage() {
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();
  const [items, setItems] = useState<AppNotification[]>();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const list = await listNotifications({ limit: PAGE_SIZE });
      setItems(list.items);
      setNextCursor(list.nextCursor);
      setUnreadCount(list.unreadCount);
      setError(undefined);
    } catch {
      setError("Couldn't load your inbox.");
    }
  }, []);

  // Catch up when the app is looked at again (no push yet).
  useEffect(() => {
    void loadFirstPage();
    window.addEventListener('focus', loadFirstPage);
    return () => window.removeEventListener('focus', loadFirstPage);
  }, [loadFirstPage]);

  async function handleLoadMore() {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const list = await listNotifications({ limit: PAGE_SIZE, before: nextCursor });
      setItems((current) => [...(current ?? []), ...list.items]);
      setNextCursor(list.nextCursor);
      setError(undefined);
    } catch {
      setError("Couldn't load more notifications.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleOpen(notification: AppNotification, traineeId: string) {
    navigate(coachTraineePath(traineeId));
    if (notification.readAt) return;
    markRead(notification.id)
      .catch(() => undefined)
      .finally(refreshUnreadCount);
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      setUnreadCount(0);
      setItems((current) => current?.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    } catch {
      setError("Couldn't mark notifications as read.");
    }
  }

  const visible = (items ?? []).flatMap((notification) => {
    const described = describeCoachNotification(notification);
    return described ? [{ notification, ...described }] : [];
  });

  return (
    <AppShell>
      <div className="coach-inbox">
        <header className="coach-inbox-header">
          <h1 className="coach-inbox-title">Inbox</h1>
          <button className="coach-inbox-read-all" type="button" disabled={unreadCount === 0} onClick={handleMarkAllRead}>
            Mark all read
          </button>
        </header>

        {error && <CoachMessage onRetry={loadFirstPage}>{error}</CoachMessage>}
        {!error && !items && <CoachMessage>Loading…</CoachMessage>}
        {!error && items && visible.length === 0 && <CoachMessage>No notifications yet.</CoachMessage>}

        <ul className="coach-inbox-list">
          {visible.map(({ notification, text, traineeId }) => (
            <li key={notification.id}>
              <button
                className={notification.readAt ? 'coach-inbox-item' : 'coach-inbox-item coach-inbox-item-unread'}
                type="button"
                onClick={() => handleOpen(notification, traineeId)}
              >
                <span className="coach-inbox-dot" aria-hidden="true" />
                <span className="coach-inbox-item-main">
                  <span className="coach-inbox-item-text">
                    {text}
                    {!notification.readAt && <span className="coach-inbox-unread-label"> (unread)</span>}
                  </span>
                  <span className="coach-inbox-item-time">{formatDateTime(notification.createdAt)}</span>
                </span>
                <IconChevronRight className="coach-inbox-chevron" size={20} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {nextCursor && (
          <Button variant="secondary" className="coach-inbox-more" loading={isLoadingMore} onClick={handleLoadMore}>
            Load more
          </Button>
        )}
      </div>
    </AppShell>
  );
}
