import type { BodyMetric, LengthUnit } from '@sistem/types';
import { IconChevronRight } from '@tabler/icons-react';
import { formatDateOnly, formatLength, measurementDays, measurementLabel } from '@sistem/shared';
import { BODY_COPY } from '../../data/bodyCopy';
import './MeasurementHistory.css';

interface MeasurementHistoryProps {
  metrics: BodyMetric[];
  measurementIds: string[];
  unit: LengthUnit;
  /** Tap a day to change or delete it; read-only (the coach) without it. */
  onEdit?: (metric: BodyMetric) => void;
}

/** Every day with measurements, newest first, each value in list order. */
export function MeasurementHistory({ metrics, measurementIds, unit, onEdit }: MeasurementHistoryProps) {
  const days = measurementDays(metrics);
  if (days.length === 0) return <p className="measurement-history-empty">{BODY_COPY.noMeasurements}</p>;

  return (
    <ul className="measurement-history">
      {days.map((metric) => {
        const content = (
          <span className="measurement-history-text">
            <span className="measurement-history-date">{formatDateOnly(metric.date)}</span>
            <span className="measurement-history-values">
              {measurementIds
                .filter((id) => metric.measurements[id] !== undefined)
                .map((id) => `${measurementLabel(id)} ${formatLength(metric.measurements[id], unit)}`)
                .join(' · ')}
            </span>
          </span>
        );
        return (
          <li key={metric.date}>
            {onEdit ? (
              <button type="button" className="measurement-history-row measurement-history-row-button" onClick={() => onEdit(metric)}>
                {content}
                <IconChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <div className="measurement-history-row">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
