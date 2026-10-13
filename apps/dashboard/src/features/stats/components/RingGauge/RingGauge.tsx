import './RingGauge.css';

interface RingGaugeProps {
  /** 0–1; null = nothing to show (an empty ring). */
  share: number | null;
  /** Which ring of the row this is: each one a step deeper, pink → Cherry Rose. */
  tone: 'pink' | 'mid' | 'deep';
  /** The ring fills from empty (the page's entrance). */
  intro: boolean;
}

const SIZE = 68;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

/** A share as a ring that fills clockwise from the top. Decorative — the percent is written next to it. */
export function RingGauge({ share, tone, intro }: RingGaugeProps) {
  return (
    <svg className={intro ? 'ring-gauge is-intro' : 'ring-gauge'} data-tone={tone} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle className="ring-gauge-track" cx={CENTER} cy={CENTER} r={RADIUS} />
      {share !== null && share > 0 && (
        // pathLength 100: the dash offset is simply the percent that is still empty.
        <circle
          className="ring-gauge-fill"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - Math.min(1, share) * 100}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      )}
    </svg>
  );
}
