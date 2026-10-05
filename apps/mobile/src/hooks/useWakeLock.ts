import { useEffect } from 'react';

/**
 * Keeps the screen on while `active` (Screen Wake Lock API). The browser drops the
 * lock whenever the page is hidden, so it is taken again on return to the foreground.
 * Unsupported or refused (low battery, old iOS): the screen simply sleeps as usual.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      if (released || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (released) void lock.release();
        else sentinel = lock;
      } catch {
        // Refused: nothing to do, the app works the same without it.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') void acquire();
    }

    void acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
