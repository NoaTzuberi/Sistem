import { useLayoutEffect, useRef } from 'react';
import './CountdownBar.css';

interface CountdownBarProps {
  /** Device clock (ms) when the countdown ends; null while paused. */
  endsAt: number | null;
  /** Time left while paused — the bar stays frozen there. */
  pausedRemainingMs: number | null;
  durationMs: number;
  /** 'fill' grows with elapsed time (interval phases); 'drain' shrinks with the time left (rest). */
  direction: 'fill' | 'drain';
  className?: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A continuous countdown line. Each animation frame reads the stored end timestamp and
 * sets transform: scaleX() on the fill (GPU, no layout, linear by construction) — React
 * re-renders on its own slower tick never move it, so there is nothing to jump. Paused:
 * drawn once and frozen. A new phase (new end time / duration) is drawn at its own
 * start at once — never animated backwards. Reduced motion: whole-second steps only.
 */
export function CountdownBar({ endsAt, pausedRemainingMs, durationMs, direction, className }: CountdownBarProps) {
  const fillRef = useRef<HTMLSpanElement>(null);

  // Layout effect: the first frame is drawn before paint (no flash of an empty bar).
  useLayoutEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    const reduced = prefersReducedMotion();
    let frame = 0;
    let lastScale = -1;

    function draw(now: number) {
      let remaining = pausedRemainingMs ?? Math.max(0, (endsAt ?? now) - now);
      if (reduced) remaining = Math.ceil(remaining / 1000) * 1000;
      const left = durationMs > 0 ? Math.min(1, remaining / durationMs) : 0;
      const scale = direction === 'drain' ? left : 1 - left;
      if (scale !== lastScale && fill) {
        lastScale = scale;
        // Inline style: the value changes every frame and only this loop knows it (like
        // dnd-kit's drag position) — a class can't express it.
        fill.style.transform = `scaleX(${scale})`;
      }
    }

    function loop() {
      draw(Date.now());
      frame = window.requestAnimationFrame(loop);
    }

    if (endsAt === null) {
      draw(Date.now());
      return;
    }
    loop();
    return () => window.cancelAnimationFrame(frame);
  }, [endsAt, pausedRemainingMs, durationMs, direction]);

  return (
    <span className={['countdown-bar', className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className="countdown-bar-fill" ref={fillRef} />
    </span>
  );
}
