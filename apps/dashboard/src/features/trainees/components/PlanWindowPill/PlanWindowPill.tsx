import './PlanWindowPill.css';

const RADIUS = 13;
const LENGTH = 2 * Math.PI * RADIUS;

interface PlanWindowPillProps {
  /** The bold line: the time left / overdue, or "3 of 4". */
  value: string;
  /** The small line under it. */
  caption: string;
  /** How full the ring is, 0–1. */
  fraction: number;
  /** The 48h window has passed: the pill turns soft pink. */
  isLate?: boolean;
}

/** The header's side pill: a small ring and two lines — the 48h window, or this week's workouts. */
export function PlanWindowPill({ value, caption, fraction, isLate = false }: PlanWindowPillProps) {
  const filled = Math.max(0, Math.min(1, fraction));
  return (
    <div className={isLate ? 'window-pill window-pill-late' : 'window-pill'}>
      <svg className="window-ring" viewBox="0 0 34 34" aria-hidden="true">
        <circle className="window-ring-track" cx="17" cy="17" r={RADIUS} />
        {/* The arc's length is data: an SVG attribute, since the dashboard has no inline styles.
            Nothing is drawn at 0 — a round line cap would still leave a dot. */}
        {filled > 0 && (
          <circle
            className="window-ring-value"
            cx="17"
            cy="17"
            r={RADIUS}
            strokeDasharray={`${(LENGTH * filled).toFixed(1)} ${LENGTH.toFixed(1)}`}
            transform="rotate(-90 17 17)"
          />
        )}
      </svg>
      <span className="window-text">
        <span className="window-value">{value}</span>
        <span className="window-caption">{caption}</span>
      </span>
    </div>
  );
}
