import { formatNumber, useCopy, useLanguage } from '@sistem/shared';
import type { GroupShare } from '../../data/nutritionSummary';
import { nutritionCopy } from '../../copy';
import './CaloriesMacroRing.css';

interface CaloriesMacroRingProps {
  /** The day's kcal from her meals' portions. */
  kcal: number;
  shares: GroupShare[];
}

const SIZE = 140;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** The white gap between two segments, in px along the ring. */
const GAP = 3;

/** A 140px donut: the day's kcal in the middle, each portion group's share of it around (thicker under a fine pointer). */
export function CaloriesMacroRing({ kcal, shares }: CaloriesMacroRingProps) {
  const language = useLanguage();
  const copy = useCopy(nutritionCopy).tab;
  const drawn = shares.filter((share) => share.share > 0);
  let start = 0;

  return (
    <div className="calories-ring">
      <svg className="calories-ring-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle className="calories-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
        {drawn.map((share) => {
          const length = Math.max(0, CIRCUMFERENCE * share.share - (drawn.length > 1 ? GAP : 0));
          const offset = -CIRCUMFERENCE * start;
          start += share.share;
          return (
            <circle
              key={share.group}
              className={`calories-ring-segment nutrition-group-${share.group}`}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeDasharray={`${length.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
              strokeDashoffset={offset.toFixed(1)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          );
        })}
      </svg>
      <p className="calories-ring-center">
        <b className="calories-ring-kcal">{formatNumber(kcal, language)}</b>
        <small>{copy.kcalPerDay}</small>
      </p>
    </div>
  );
}
