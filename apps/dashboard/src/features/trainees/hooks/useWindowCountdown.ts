import { useMemo } from 'react';
import { formatTimeLeft, useLanguage } from '@sistem/shared';

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
/** The promise of the waiting screen: her first plan within 48 hours of the questionnaire. */
export const PLAN_WINDOW_HOURS = 48;

export interface WindowCountdown {
  /** The window has passed. */
  isLate: boolean;
  /** 0–1: how much of the 48 hours has gone by (1 once late). */
  elapsed: number;
  /** 'H:MM' left (or over), for the ring's center. */
  clock: string;
  /** 'נותרו 31:20 שע׳' / 'באיחור של 2:05 שע׳' — the shared wording of every 48h countdown. */
  title: string;
}

/**
 * The 48-hour window of a trainee waiting for her first plan, against the server's clock
 * (`nowMs` from the coach data, which moves on by itself while the page is open). null without a window.
 */
export function useWindowCountdown(planDueAt: string | null, nowMs: number): WindowCountdown | null {
  const language = useLanguage();
  // Whole minutes are all it shows: recompute once a minute, not on every clock tick.
  const minute = Math.floor(nowMs / MINUTE_MS);

  return useMemo(() => {
    if (!planDueAt) return null;
    const now = minute * MINUTE_MS;
    const leftMs = new Date(planDueAt).getTime() - now;
    const isLate = leftMs < 0;
    const totalMinutes = Math.floor(Math.abs(leftMs) / MINUTE_MS);
    const clock = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
    const elapsed = isLate ? 1 : Math.max(0, Math.min(1, 1 - leftMs / (PLAN_WINDOW_HOURS * HOUR_MS)));
    return { isLate, elapsed, clock, title: formatTimeLeft(planDueAt, now, language).text };
  }, [planDueAt, minute, language]);
}
