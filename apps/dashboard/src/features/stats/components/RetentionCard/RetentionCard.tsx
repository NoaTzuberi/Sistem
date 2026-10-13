import type { CoachStatsRetention } from '@sistem/types';
import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { formatShare } from '../../../overview/data/overviewFormat';
import { statsCopy } from '../../copy';
import { RatingStars } from '../RatingStars/RatingStars';
import { RingGauge } from '../RingGauge/RingGauge';
import './RetentionCard.css';

interface RetentionCardProps {
  retention: CoachStatsRetention[];
  /** 1–5, or null when no workout was rated in the range. */
  averageRating: number | null;
  /** The rings fill from empty (the page's entrance). */
  intro: boolean;
}

const MAX_RATING = 5;
const NONE = '—';
const RING_TONES = { 1: 'pink', 3: 'mid', 6: 'deep' } as const;

/** Who is still training after 1 / 3 / 6 months — a ring each — and next to them the average workout rating in stars. */
export function RetentionCard({ retention, averageRating, intro }: RetentionCardProps) {
  const language = useLanguage();
  const copy = useCopy(statsCopy);
  const labels: Record<CoachStatsRetention['months'], string> = {
    1: copy.retention.month1,
    3: copy.retention.month3,
    6: copy.retention.month6,
  };

  return (
    <div className="retention-card">
      {retention.map((cell) => {
        // Nobody has been here that long yet: no data, not 0%.
        const hasData = cell.eligible > 0;
        return (
          <div
            key={cell.months}
            className="retention-cell"
            role="group"
            aria-label={labels[cell.months]}
            title={hasData ? fill(copy.retention.count, { retained: cell.retained, eligible: cell.eligible }) : undefined}
          >
            <RingGauge share={hasData ? cell.retained / cell.eligible : null} tone={RING_TONES[cell.months]} intro={intro} />
            <div className="retention-text">
              <p className="retention-value">
                <bdi>{formatShare(cell.retained, cell.eligible, language) ?? NONE}</bdi>
              </p>
              <p className="retention-label">{labels[cell.months]}</p>
              {!hasData && <p className="retention-none">{copy.retention.noData}</p>}
            </div>
          </div>
        );
      })}
      <div className="retention-cell retention-rating" role="group" aria-label={copy.retention.rating}>
        <RatingStars value={averageRating} max={MAX_RATING} />
        <p className="retention-value">
          {averageRating === null ? (
            NONE
          ) : (
            <bdi dir="ltr">
              {formatNumber(averageRating, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <small className="retention-of">/{MAX_RATING}</small>
            </bdi>
          )}
        </p>
        <p className="retention-label">{copy.retention.rating}</p>
        {averageRating === null && <p className="retention-none">{copy.retention.noData}</p>}
      </div>
    </div>
  );
}
