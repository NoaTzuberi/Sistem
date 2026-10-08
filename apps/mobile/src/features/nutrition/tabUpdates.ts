import { useEffect, useSyncExternalStore } from 'react';
import type { TabUpdates, UpdateTab } from '@sistem/types';
import { getTabUpdates, markTabSeen } from '../../services/nutrition/nutritionService';

const POLL_MS = 60_000;

// The "unseen update" dots on the trainee's tab bar (Phase 13a): one shared state for the
// whole app (the tab bar mounts again on every screen). "Seen" is stored on the server, so
// opening a tab on one device clears it everywhere. No push yet (Phase 5b): poll, and catch
// up when the app is looked at again.
let updates: TabUpdates = { workouts: false, nutrition: false };
const listeners = new Set<() => void>();
const pendingSeen = new Set<UpdateTab>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setUpdates(next: TabUpdates): void {
  updates = next;
  listeners.forEach((listener) => listener());
}

export async function refreshTabUpdates(): Promise<void> {
  try {
    setUpdates(await getTabUpdates());
  } catch {
    // A failed poll keeps the last known dots.
  }
}

/** She opened the tab: clear its dot here at once, and on the server. */
export async function clearTabUpdate(tab: UpdateTab): Promise<void> {
  if (pendingSeen.has(tab)) return;
  pendingSeen.add(tab);
  setUpdates({ ...updates, [tab]: false });
  try {
    setUpdates(await markTabSeen(tab));
  } catch {
    // Not stored: the next poll brings the dot back, and opening the tab clears it again.
  } finally {
    pendingSeen.delete(tab);
  }
}

export function useTabUpdates(enabled: boolean): TabUpdates {
  useEffect(() => {
    if (!enabled) return;
    void refreshTabUpdates();
    const timer = window.setInterval(refreshTabUpdates, POLL_MS);
    window.addEventListener('focus', refreshTabUpdates);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshTabUpdates);
    };
  }, [enabled]);

  return useSyncExternalStore(subscribe, () => updates);
}
