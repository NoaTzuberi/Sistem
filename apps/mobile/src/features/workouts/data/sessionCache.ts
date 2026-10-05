import type { WorkoutLogSetUpdate, WorkoutSession } from '@sistem/types';

// The session kept on the phone (PRD §11: active workout state persisted locally and
// synced on reconnect). Every set change lands here first, so a closed app, a lost
// connection or a reload never loses it; the server copy catches up when it can.
// Storage can be unavailable (private mode, quota): every call is best effort.

export interface CachedSession {
  /** The last session the server sent — lets the screen open offline. */
  session: WorkoutSession;
  /** Set changes the server hasn't confirmed yet, keyed by set key. */
  pending: Record<string, WorkoutLogSetUpdate>;
  /** Sets she edited by hand (carry forward never overwrites them). */
  touched: string[];
  /** Device clock (ms) when the rest ends; the rest timer is local UX, not a record. */
  restEndsAt: number | null;
  restTotalSec: number | null;
  /** She tapped Finish while offline: finish as soon as the connection is back. */
  finishRequested: boolean;
}

const KEY_PREFIX = 'sistem.workoutSession.';

export function loadCachedSession(logId: string): CachedSession | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + logId);
    return raw ? (JSON.parse(raw) as CachedSession) : null;
  } catch {
    return null;
  }
}

export function saveCachedSession(logId: string, cached: CachedSession): void {
  try {
    localStorage.setItem(KEY_PREFIX + logId, JSON.stringify(cached));
  } catch {
    // Full or blocked storage: the server copy still has everything sent so far.
  }
}

export function clearCachedSession(logId: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + logId);
  } catch {
    // Nothing to clean up.
  }
}
