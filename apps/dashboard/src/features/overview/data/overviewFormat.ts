import type { Language } from '@sistem/types';
import { formatNumber } from '@sistem/shared';

const DAY_MS = 86_400_000;

/**
 * The week of the year for a 'YYYY-MM-DD' date, counted the way the app's weeks run: weeks
 * start on Sunday and week 1 is the one that holds 1 January (the Israeli calendar rule).
 */
export function weekOfYear(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const firstDay = Date.UTC(year, 0, 1);
  const dayOfYear = Math.round((Date.UTC(year, month - 1, day) - firstDay) / DAY_MS);
  return Math.floor((dayOfYear + new Date(firstDay).getUTCDay()) / 7) + 1;
}

/** Sunday = 0 … Saturday = 6 of a 'YYYY-MM-DD' date. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** done / planned as a whole percent ('85%'), or null when nothing was planned. */
export function formatShare(done: number, planned: number, language: Language): string | null {
  if (planned <= 0) return null;
  return formatNumber(done / planned, language, { style: 'percent', maximumFractionDigits: 0 });
}

/** '+3' / '−2'; null for no change (nothing is shown then). */
export function formatChange(change: number, language: Language): string | null {
  return change === 0 ? null : formatNumber(change, language, { signDisplay: 'always' });
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** The part of the day at `nowMs` in `timezone` — the greeting follows her clock, not the browser's. */
export function dayPartAt(nowMs: number, timezone: string): DayPart {
  // A number read back from the formatter, never shown: the locale only fixes its digits. i18n-ignore
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: timezone }).format(nowMs));
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
