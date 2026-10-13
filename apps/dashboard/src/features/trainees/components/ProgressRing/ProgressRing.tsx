import type { ReactNode } from 'react';
import './ProgressRing.css';

const RADIUS = 48;
const LENGTH = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  /** 0–1. */
  fraction: number;
  /** What the ring says to a screen reader ("2 of 4 workouts completed"). */
  label: string;
  /** The text in its middle. */
  children: ReactNode;
}

/** A large ring with text in its middle: how much of the week is done. Cherry Rose, never green. */
export function ProgressRing({ fraction, label, children }: ProgressRingProps) {
  const filled = Math.max(0, Math.min(1, fraction));
  return (
    <div className="progress-ring" role="img" aria-label={label}>
      <svg className="progress-ring-svg" viewBox="0 0 112 112" aria-hidden="true">
        <circle className="progress-ring-track" cx="56" cy="56" r={RADIUS} />
        {/* The arc's length is data: an SVG attribute. Nothing is drawn at 0 (a round cap would leave a dot). */}
        {filled > 0 && (
          <circle
            className="progress-ring-value"
            cx="56"
            cy="56"
            r={RADIUS}
            strokeDasharray={`${(LENGTH * filled).toFixed(1)} ${LENGTH.toFixed(1)}`}
            transform="rotate(-90 56 56)"
          />
        )}
      </svg>
      <div className="progress-ring-text" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
