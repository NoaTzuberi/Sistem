import type { CoachStatsRetention } from '@sistem/types';
import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { formatShare } from '../../../overview/data/overviewFormat';
import { statsCopy } from '../../copy';
import './RetentionRow.css';

interface RetentionRowProps {
  retention: CoachStatsRetention[];
  /** 1–5, or null when no workout was rated in the range. */
  averageRating: number | null;
}

const MAX_RATING = 5;

/** Who is still training after 1 / 3 / 6 months, and next to it the average workout rating. */
export function RetentionRow({ retention, averageRating }: RetentionRowProps) {
  const language = useLanguage();
  const copy = useCopy(statsCopy);
  const labels: Record<CoachStatsRetention['months'], string> = {
    1: copy.retention.month1,
    3: copy.retention.month3,
    6: copy.retention.month6,
  };

  return (
    <dl className="retention-row">
      {retention.map((cell) => {
        const share = formatShare(cell.retained, cell.eligible, language);
        return (
          <div
            key={cell.months}
            className="retention-cell"
            title={cell.eligible > 0 ? fill(copy.retention.count, { retained: cell.retained, eligible: cell.eligible }) : undefined}
          >
            <dt className="retention-label">{labels[cell.months]}</dt>
            <dd className="retention-value">
              <bdi>{share ?? '—'}</bdi>
            </dd>
            <span className="retention-track" aria-hidden="true">
              {/* A computed value: the bar's width is the data. */}
              <span className="retention-fill" style={{ inlineSize: `${cell.eligible > 0 ? (cell.retained / cell.eligible) * 100 : 0}%` }} />
            </span>
          </div>
        );
      })}
      <div className="retention-cell retention-rating">
        <dt className="retention-label">{copy.retention.rating}</dt>
        <dd className="retention-value">
          {averageRating === null ? (
            '—'
          ) : (
            <bdi dir="ltr">
              {formatNumber(averageRating, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <small className="retention-of">/{MAX_RATING}</small>
            </bdi>
          )}
        </dd>
      </div>
    </dl>
  );
}
