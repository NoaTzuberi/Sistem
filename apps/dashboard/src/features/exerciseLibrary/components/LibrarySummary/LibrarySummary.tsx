import { useCopy } from '@sistem/shared';
import { exerciseLibraryCopy } from '../../copy';
import './LibrarySummary.css';

interface LibrarySummaryProps {
  families: number | undefined;
  toReview: number | undefined;
}

/** The library in two numbers (the server's totals); a number not loaded yet is not shown. */
export function LibrarySummary({ families, toReview }: LibrarySummaryProps) {
  const copy = useCopy(exerciseLibraryCopy);
  return (
    <dl className="library-summary">
      {families !== undefined && (
        <div className="library-summary-card">
          <dt>{copy.summaryFamilies}</dt>
          <dd>{families}</dd>
        </div>
      )}
      {toReview !== undefined && (
        <div className="library-summary-card library-summary-card-warning">
          <dt>{copy.summaryToReview}</dt>
          <dd>{toReview}</dd>
        </div>
      )}
    </dl>
  );
}
