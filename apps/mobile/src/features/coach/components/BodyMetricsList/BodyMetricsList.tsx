import { useCallback } from 'react';
import { formatDateOnly, humanizeId, useLoad } from '@sistem/shared';
import { listTraineeBodyMetrics } from '../../../../services/coach/coachService';
import { CoachMessage } from '../CoachMessage/CoachMessage';
import './BodyMetricsList.css';

interface BodyMetricsListProps {
  traineeId: string;
}

export function BodyMetricsList({ traineeId }: BodyMetricsListProps) {
  const load = useCallback(() => listTraineeBodyMetrics(traineeId), [traineeId]);
  const { data: metrics, error, isLoading, reload } = useLoad(load, "Couldn't load the body metrics.");

  if (isLoading && !metrics) return <CoachMessage>Loading…</CoachMessage>;
  if (!metrics) return <CoachMessage onRetry={reload}>{error}</CoachMessage>;
  if (metrics.length === 0) return <CoachMessage>No body metrics yet.</CoachMessage>;

  return (
    <ul className="body-metrics">
      {metrics.map((metric) => (
        <li key={metric.id} className="body-metric">
          <span className="body-metric-date">{formatDateOnly(metric.date)}</span>
          <dl className="body-metric-values">
            {metric.weight !== undefined && (
              <div>
                <dt>Weight</dt>
                <dd>{metric.weight} kg</dd>
              </div>
            )}
            {Object.entries(metric.measurements).map(([id, value]) => (
              <div key={id}>
                <dt>{humanizeId(id)}</dt>
                <dd>{value} cm</dd>
              </div>
            ))}
          </dl>
          {/* Progress photos need signed URLs (Phase 10): only the poses for now. */}
          {metric.photos.length > 0 && (
            <p className="body-metric-photo-slot">
              Photos: {metric.photos.map((photo) => humanizeId(photo.pose)).join(', ')}
            </p>
          )}
          {metric.notes && <p className="body-metric-notes">{metric.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
