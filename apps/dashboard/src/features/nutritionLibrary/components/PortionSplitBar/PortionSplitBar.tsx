import type { CSSProperties } from 'react';
import { formatNumber, useCopy, useLanguage } from '@sistem/shared';
import type { SplitSegment } from '../../hooks/usePortionSplit';
import { nutritionLibraryCopy } from '../../copy';
import './PortionSplitBar.css';

// A share under this many % is too thin for its number.
const MIN_LABEL_PCT = 6;

/**
 * The split as one 100% bar: a segment per group in its color, sized by its share; what is still
 * missing shows as pink stripes. Over 100 the segments just share the bar. Decorative — the steppers
 * under it and the sum pill carry the numbers.
 */
export function PortionSplitBar({ segments, total }: { segments: SplitSegment[]; total: number }) {
  const language = useLanguage();
  const copy = useCopy(nutritionLibraryCopy);
  const gap = Math.max(0, 100 - total);
  return (
    <div className="portion-split-bar" aria-hidden="true">
      {segments.map(({ group, pct }) => (
        <span key={group} className={`portion-split-segment portion-split-${group}`} style={{ '--share': pct } as CSSProperties}>
          {pct >= MIN_LABEL_PCT && (
            <span className="portion-split-value" dir="ltr">
              {formatNumber(pct, language)}
              {copy.percent}
            </span>
          )}
        </span>
      ))}
      {gap > 0 && <span className="portion-split-segment portion-split-gap" style={{ '--share': gap } as CSSProperties} />}
    </div>
  );
}
