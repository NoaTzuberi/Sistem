import { useEffect, useState } from 'react';

const TICK_MS = 30_000;

/**
 * "Now" on the server's clock, refreshed every 30 seconds. Countdowns (the 48h
 * window) must not depend on this computer's clock (PRD §11), so the server time
 * that came with the data is kept as an offset.
 */
export function useServerNow(serverTime: string | undefined): number {
  const [offsetMs, setOffsetMs] = useState(0);
  const [clientNow, setClientNow] = useState(() => Date.now());

  useEffect(() => {
    if (serverTime) setOffsetMs(new Date(serverTime).getTime() - Date.now());
  }, [serverTime]);

  useEffect(() => {
    const timer = window.setInterval(() => setClientNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return clientNow + offsetMs;
}
