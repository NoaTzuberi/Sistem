import { useEffect, useState } from 'react';

const DEFAULT_DURATION_MS = 800;

/**
 * `target` counting up from 0 with an ease-out cubic while `animate` is true; the plain target
 * otherwise (so a later change of the number — a new range — is shown at once).
 */
export function useCountUp(target: number, animate: boolean, durationMs: number = DEFAULT_DURATION_MS): number {
  const [progress, setProgress] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - start) / durationMs);
      setProgress(1 - (1 - elapsed) ** 3);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, durationMs]);

  return animate ? target * progress : target;
}
