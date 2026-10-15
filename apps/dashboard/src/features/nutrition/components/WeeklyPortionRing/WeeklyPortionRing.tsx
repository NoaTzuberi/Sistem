import type { PortionGroup } from '@sistem/types';
import { formatPortionCount, isolateLtr } from '@sistem/shared';
import './WeeklyPortionRing.css';

const SIZE = 64;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;

interface WeeklyPortionRingProps {
  group: PortionGroup;
  label: string;
  eaten: number;
  planned: number;
  /** "Protein: 9½ of 21 this week". */
  description: string;
}

/** One group's week: portions marked against the week's plan, as a ring on a tile in the group's color. */
export function WeeklyPortionRing({ group, label, eaten, planned, description }: WeeklyPortionRingProps) {
  const share = planned > 0 ? Math.min(1, eaten / planned) : 0;
  return (
    <div className="nb-week-ring" data-group={group} role="img" aria-label={description}>
      <span className="nb-week-ring-graphic">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="nb-week-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
          {share > 0 && (
            <circle
              className="nb-week-ring-value"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              pathLength={100}
              strokeDasharray={`${(share * 100).toFixed(1)} 100`}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          )}
        </svg>
      </span>
      <span className="nb-week-ring-text" aria-hidden="true">
        <span className="nb-week-ring-label">{label}</span>
        <b className="nb-week-ring-count">{isolateLtr(`${formatPortionCount(eaten)} / ${formatPortionCount(planned)}`)}</b>
      </span>
    </div>
  );
}
