// Per-browser conveniences of the notifications panel. The server has no "dismiss" and knows
// nothing of the 48h-window alerts (they are made here from the trainees list), so these two
// small lists live in localStorage: they never leave this browser and the panel works without them.

const DISMISSED_KEY = 'sistem.dashboard.notifications.dismissed';
const SEEN_ALERTS_KEY = 'sistem.dashboard.notifications.seenAlerts';
/** Old entries fall off: the lists only need to cover what the panel can still show. */
const MAX_ENTRIES = 200;

function read(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    // Private window / blocked storage: nothing remembered.
    return [];
  }
}

function add(key: string, ids: string[]): string[] {
  const next = [...new Set([...read(key), ...ids])].slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Not remembered across reloads; still applied for this visit by the caller's state.
  }
  return next;
}

export const readDismissed = () => read(DISMISSED_KEY);
export const addDismissed = (ids: string[]) => add(DISMISSED_KEY, ids);
export const readSeenAlerts = () => read(SEEN_ALERTS_KEY);
export const addSeenAlerts = (ids: string[]) => add(SEEN_ALERTS_KEY, ids);
