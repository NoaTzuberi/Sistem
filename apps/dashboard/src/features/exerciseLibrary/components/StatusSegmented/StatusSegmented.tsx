import { useCopy } from '@sistem/shared';
import { REVIEW_STATUSES } from '../../data/familyReview';
import type { ReviewStatus } from '../../data/familyReview';
import { exerciseLibraryCopy } from '../../copy';
import './StatusSegmented.css';

interface StatusSegmentedProps {
  value: ReviewStatus;
  /** Families per status for the current search / pattern; unknown = no number. */
  counts: Partial<Record<ReviewStatus, number>>;
  onChange: (status: ReviewStatus) => void;
}

/** The review status as an iOS-style segmented control: a white thumb that slides (transform only). */
export function StatusSegmented({ value, counts, onChange }: StatusSegmentedProps) {
  const copy = useCopy(exerciseLibraryCopy);
  const index = REVIEW_STATUSES.indexOf(value);
  return (
    <div className={`status-segmented status-segmented-at-${index}`} role="group" aria-label={copy.filterLabel}>
      <span className="status-segmented-thumb" aria-hidden="true" />
      {REVIEW_STATUSES.map((status) => (
        <button key={status} className="status-segmented-option" type="button" aria-pressed={status === value} onClick={() => onChange(status)}>
          {status !== 'all' && <span className={`status-segmented-dot status-segmented-dot-${status}`} aria-hidden="true" />}
          <span className="status-segmented-label">{copy.filters[status]}</span>
          {counts[status] !== undefined && <span className="status-segmented-count">{counts[status]}</span>}
        </button>
      ))}
    </div>
  );
}
