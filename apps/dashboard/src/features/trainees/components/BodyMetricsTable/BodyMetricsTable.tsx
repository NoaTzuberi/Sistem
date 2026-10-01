import { useCallback } from 'react';
import { listTraineeBodyMetrics } from '../../../../services/coach/coachService';
import { useLoad } from '../../../../hooks/useLoad';
import { formatDateOnly, humanizeId } from '../../../../utils/format';
import { Button } from '../../../../components/common/Button/Button';
import './BodyMetricsTable.css';

interface BodyMetricsTableProps {
  traineeId: string;
}

export function BodyMetricsTable({ traineeId }: BodyMetricsTableProps) {
  const load = useCallback(() => listTraineeBodyMetrics(traineeId), [traineeId]);
  const { data: metrics, error, isLoading, reload } = useLoad(load, "Couldn't load the body metrics.");

  if (isLoading && !metrics) return <p className="metrics-message">Loading…</p>;
  if (error && !metrics) {
    return (
      <p className="metrics-message" role="alert">
        {error} <Button size="sm" onClick={reload}>Try again</Button>
      </p>
    );
  }
  if (!metrics || metrics.length === 0) return <p className="metrics-message">No body metrics yet.</p>;

  // One column per measurement that was ever logged, in first-seen order.
  const measurementIds = [...new Set(metrics.flatMap((metric) => Object.keys(metric.measurements)))];

  return (
    <div className="metrics-scroll">
      <table className="metrics-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Weight (kg)</th>
            {measurementIds.map((id) => (
              <th key={id} scope="col">
                {humanizeId(id)} (cm)
              </th>
            ))}
            {/* Progress photos need signed URLs (Phase 10): only the count for now. */}
            <th scope="col">Photos</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.id}>
              <td>{formatDateOnly(metric.date)}</td>
              <td>{metric.weight ?? '—'}</td>
              {measurementIds.map((id) => (
                <td key={id}>{metric.measurements[id] ?? '—'}</td>
              ))}
              <td>{metric.photos.length > 0 ? metric.photos.map((photo) => humanizeId(photo.pose)).join(', ') : '—'}</td>
              <td>{metric.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
