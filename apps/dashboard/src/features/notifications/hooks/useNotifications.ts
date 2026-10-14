import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppNotification } from '@sistem/types';
import { useLanguage } from '@sistem/shared';
import { useCoachData } from '../../../services/coach/CoachDataContext';
import { getUnreadCount, listNotifications, markAllRead, markRead } from '../../../services/notifications/notificationsService';
import { buildServerNotice, buildWindowAlerts } from '../data/notificationItems';
import type { NoticeItem } from '../data/notificationItems';
import { addDismissed, addSeenAlerts, readDismissed, readSeenAlerts } from '../data/notificationStore';

const POLL_MS = 60_000;
const PANEL_LIMIT = 30;

/**
 * Everything the bell and its panel show: the server's notifications (polled count, the list
 * while the panel is open, mark-read through the existing API — applied at once, undone if the
 * server refuses) plus the 48h-window alerts made here from the trainees list. "Dismiss" and the
 * read state of a window alert are per-browser (the server has neither).
 */
export function useNotifications(isPanelOpen: boolean) {
  const language = useLanguage();
  const { trainees, nowMs, weekOf } = useCoachData();
  const [serverUnread, setServerUnread] = useState(0);
  const [loaded, setLoaded] = useState<AppNotification[]>();
  const [error, setError] = useState<'load' | 'markRead'>();
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set(readDismissed()));
  const [seenAlertIds, setSeenAlertIds] = useState<ReadonlySet<string>>(() => new Set(readSeenAlerts()));

  const refreshCount = useCallback(async () => {
    try {
      setServerUnread(await getUnreadCount());
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

  // The list is fetched fresh each time the panel opens.
  useEffect(() => {
    if (!isPanelOpen) return;
    let isCurrent = true;
    listNotifications({ limit: PANEL_LIMIT })
      .then((list) => {
        if (!isCurrent) return;
        setLoaded(list.items);
        setServerUnread(list.unreadCount);
        setError(undefined);
      })
      .catch(() => isCurrent && setError('load'));
    return () => {
      isCurrent = false;
    };
  }, [isPanelOpen]);

  const alerts = useMemo(
    () => buildWindowAlerts(trainees, nowMs, seenAlertIds, language).filter((item) => !dismissedIds.has(item.id)),
    [trainees, nowMs, seenAlertIds, dismissedIds, language],
  );

  const items = useMemo<NoticeItem[]>(() => {
    const waiting = new Set(trainees.filter((person) => person.planDueAt !== null).map((person) => person.id));
    const fromServer = (loaded ?? [])
      .filter((notification) => !dismissedIds.has(notification.id))
      .flatMap((notification) => buildServerNotice(notification, { nowMs, language, isWaiting: (id) => waiting.has(id), weekOf }) ?? []);
    return [...alerts, ...fromServer];
  }, [alerts, loaded, dismissedIds, trainees, nowMs, language, weekOf]);

  const unreadCount = serverUnread + alerts.filter((item) => item.isUnread).length;

  /** Optimistic: the item reads as read (and the badge drops) at once. */
  const markItemRead = useCallback(
    async (item: NoticeItem) => {
      if (!item.isUnread) return;
      if (!item.serverId) {
        // A passed window stays unread until her plan is published.
        if (item.type !== 'late') setSeenAlertIds(new Set(addSeenAlerts([item.id])));
        return;
      }
      const readAt = new Date().toISOString();
      setLoaded((current) => current?.map((entry) => (entry.id === item.serverId ? { ...entry, readAt } : entry)));
      setServerUnread((count) => Math.max(0, count - 1));
      try {
        await markRead(item.serverId);
      } catch {
        setError('markRead');
      } finally {
        void refreshCount();
      }
    },
    [refreshCount],
  );

  const markEverythingRead = useCallback(async () => {
    const before = loaded;
    const readAt = new Date().toISOString();
    setLoaded((current) => current?.map((entry) => ({ ...entry, readAt: entry.readAt ?? readAt })));
    setServerUnread(0);
    setSeenAlertIds(new Set(addSeenAlerts(alerts.filter((item) => item.type !== 'late').map((item) => item.id))));
    try {
      await markAllRead();
      setError(undefined);
    } catch {
      setLoaded(before);
      setError('markRead');
      void refreshCount();
    }
  }, [loaded, alerts, refreshCount]);

  /** Out of the panel (in this browser), and read on the server. */
  const dismiss = useCallback(
    (item: NoticeItem) => {
      if (!item.canDismiss) return;
      setDismissedIds(new Set(addDismissed([item.id])));
      void markItemRead(item);
    },
    [markItemRead],
  );

  return {
    items,
    unreadCount,
    /** The server list has not arrived yet (the window alerts are already there). */
    isLoading: isPanelOpen && loaded === undefined && error !== 'load',
    error,
    markItemRead,
    markEverythingRead,
    dismiss,
  };
}
