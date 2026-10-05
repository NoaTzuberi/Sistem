import { useEffect, useState } from 'react';

const TICK_MS = 250;

/**
 * Milliseconds left until `endsAt` (device clock), re-read from the end time on every
 * tick — never counted down tick by tick, so a throttled or backgrounded tab is right
 * again the moment it is visible. null when there is no countdown.
 */
export function useCountdown(endsAt: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return endsAt === null ? null : Math.max(0, endsAt - now);
}
