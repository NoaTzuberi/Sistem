import { useEffect, useSyncExternalStore } from 'react';
import { getUnreadCount } from '../../services/notifications/notificationsService';

const POLL_MS = 60_000;

// One count for the whole app: the tab bar is mounted again on every screen, and the
// Inbox changes the count (mark read) while the tab bar shows it.
let unreadCount = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setUnreadCount(count: number): void {
  unreadCount = Math.max(0, count);
  listeners.forEach((listener) => listener());
}

export async function refreshUnreadCount(): Promise<void> {
  try {
    setUnreadCount(await getUnreadCount());
  } catch {
    // A failed poll just keeps the last known count.
  }
}

/**
 * The signed-in user's unread notifications. No push yet (Phase 5b): poll, and catch
 * up when the app is looked at again.
 */
export function useUnreadCount(): number {
  useEffect(() => {
    void refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, POLL_MS);
    window.addEventListener('focus', refreshUnreadCount);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshUnreadCount);
    };
  }, []);

  return useSyncExternalStore(subscribe, () => unreadCount);
}
