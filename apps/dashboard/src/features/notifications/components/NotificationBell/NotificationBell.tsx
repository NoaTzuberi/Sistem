import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '@sistem/types';
import { listNotifications, getUnreadCount, markRead, markAllRead } from '../../../../services/notifications/notificationsService';
import { traineePath } from '../../../../app/config/routes';
import { describeCoachNotification, fill, formatDateTime, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import './NotificationBell.css';

const POLL_MS = 60_000;
const PANEL_LIMIT = 20;

export function NotificationBell() {
  const shared = useCopy(sharedCopy);
  const inbox = shared.coach.inbox;
  const language = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>();
  const [error, setError] = useState<'load' | 'markRead'>();

  const refreshCount = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      // A failed poll just keeps the last known count.
    }
  }, []);

  // No push on the web (PRD §11): poll, and catch up when the tab is looked at again.
  useEffect(() => {
    void refreshCount();
    const timer = window.setInterval(refreshCount, POLL_MS);
    window.addEventListener('focus', refreshCount);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshCount);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!isOpen) return;

    listNotifications({ limit: PANEL_LIMIT })
      .then((list) => {
        setItems(list.items);
        setUnreadCount(list.unreadCount);
        setError(undefined);
      })
      .catch(() => setError('load'));

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleOpenItem(notification: AppNotification, path: string) {
    setIsOpen(false);
    navigate(path);
    if (notification.readAt) return;
    try {
      await markRead(notification.id);
    } finally {
      void refreshCount();
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      setUnreadCount(0);
      setItems((current) => current?.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    } catch {
      setError('markRead');
    }
  }

  const visible = (items ?? []).flatMap((notification) => {
    // The wording and the target are shared with the mobile Inbox.
    const described = describeCoachNotification(notification, language);
    return described ? [{ notification, text: described.text, path: traineePath(described.traineeId, described.section ?? undefined) }] : [];
  });

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        className="bell-button"
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? fill(inbox.bellUnread, { count: unreadCount }) : inbox.notificationsTitle}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg className="bell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V9a6 6 0 0 0-6-6Zm-2 16a2 2 0 0 0 4 0Z" />
        </svg>
        {unreadCount > 0 && <span className="bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="bell-panel" role="region" aria-label={inbox.notificationsTitle}>
          <div className="bell-panel-header">
            <h2 className="bell-panel-title">{inbox.notificationsTitle}</h2>
            <button className="bell-read-all" type="button" disabled={unreadCount === 0} onClick={handleMarkAllRead}>
              {inbox.markAllRead}
            </button>
          </div>

          {error && (
            <p className="bell-message" role="alert">
              {error === 'load' ? inbox.bellLoadError : inbox.markReadError}
            </p>
          )}
          {!error && !items && <p className="bell-message">{shared.common.loading}</p>}
          {!error && items && visible.length === 0 && <p className="bell-message">{inbox.empty}</p>}

          <ul className="bell-list">
            {visible.map(({ notification, text, path }) => (
              <li key={notification.id}>
                <button
                  className={notification.readAt ? 'bell-item' : 'bell-item bell-item-unread'}
                  type="button"
                  onClick={() => handleOpenItem(notification, path)}
                >
                  <span className="bell-item-text">{text}</span>
                  <span className="bell-item-time">{formatDateTime(notification.createdAt, language)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
