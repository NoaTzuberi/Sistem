import type { BodyMetric, WeightUnit } from '@sistem/types';
import { IconChevronRight } from '@tabler/icons-react';
import { formatDateOnly, formatWeight, weighIns } from '@sistem/shared';
import { BODY_COPY } from '../../data/bodyCopy';
import './WeightHistory.css';

interface WeightHistoryProps {
  metrics: BodyMetric[];
  unit: WeightUnit;
  /** Tap a row to change or delete it; read-only (the coach) without it. */
  onEdit?: (metric: BodyMetric & { weight: number }) => void;
}

/** Every weigh-in, newest first — the chart's values as a list. */
export function WeightHistory({ metrics, unit, onEdit }: WeightHistoryProps) {
  const days = weighIns(metrics);
  if (days.length === 0) return <p className="weight-history-empty">{BODY_COPY.noWeight}</p>;

  return (
    <ul className="weight-history">
      {days.map((metric) => {
        const content = (
          <>
            <span className="weight-history-date">{formatDateOnly(metric.date)}</span>
            <span className="weight-history-value">{formatWeight(metric.weight, unit)}</span>
          </>
        );
        return (
          <li key={metric.date}>
            {onEdit ? (
              <button type="button" className="weight-history-row weight-history-row-button" onClick={() => onEdit(metric)}>
                {content}
                <IconChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <div className="weight-history-row">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
