import { useCallback, useState } from 'react';
import { fill, formatDateOnly, measurementDays, measurementLabel, measurementPoints, poseLabel, sharedCopy, todayInTimezone, useCopy, useLanguage, useLoad, weightPoints } from '@sistem/shared';
import { listTraineeBodyMetrics } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { BodyTrendChart } from '../BodyTrendChart/BodyTrendChart';
import { ProgressPhotos } from '../ProgressPhotos/ProgressPhotos';
import './BodyTracking.css';
import { traineesCopy } from '../../copy';

interface BodyTrackingProps {
  traineeId: string;
  /** The trainee's time zone: chart ranges end on her today. */
  timezone: string;
}

/**
 * The Body tab (Phase 10, PRD §6): weight and measurement charts, every entry as a
 * table, and the progress photos with compare. Read-only, kg / cm.
 */
export function BodyTracking({ traineeId, timezone }: BodyTrackingProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const load = useCallback(() => listTraineeBodyMetrics(traineeId), [traineeId]);
  const { data: list, error, isLoading, reload } = useLoad(load, copy.bodyLoadError);
  const [picked, setPicked] = useState<string | null>(null);

  if (isLoading && !list) return <p className="body-tracking-message">{shared.common.loading}</p>;
  if (!list) {
    return (
      <p className="body-tracking-message" role="alert">
        {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
      </p>
    );
  }
  if (list.items.length === 0) return <p className="body-tracking-message">{copy.bodyEmpty}</p>;

  const today = todayInTimezone(timezone);
  const firstLogged = list.measurementIds.find((id) => measurementDays(list.items).some((day) => day.measurements[id] !== undefined));
  const measurementId = picked ?? firstLogged ?? list.measurementIds[0];

  return (
    <div className="body-tracking">
      <div className="body-tracking-charts">
        <BodyTrendChart points={weightPoints(list.items, 'kg')} unit="kg" title={copy.weight} today={today} />
        <div className="body-tracking-measurement">
          <BodyTrendChart
            key={measurementId}
            points={measurementPoints(list.items, measurementId, 'cm')}
            unit="cm"
            title={measurementLabel(measurementId, language)}
            today={today}
          />
          <div className="body-tracking-measurement-picker" role="group" aria-label={copy.measurement}>
            {list.measurementIds.map((id) => (
              <button key={id} type="button" className="body-tracking-chip" aria-pressed={id === measurementId} onClick={() => setPicked(id)}>
                {measurementLabel(id, language)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section aria-label={copy.everyEntry}>
        <h3 className="body-tracking-heading">{copy.entries}</h3>
        <div className="body-tracking-scroll">
          <table className="body-tracking-table">
            <thead>
              <tr>
                <th scope="col">{copy.date}</th>
                <th scope="col">{copy.weightKg}</th>
                {list.measurementIds.map((id) => (
                  <th key={id} scope="col">
                    {fill(copy.cmSuffix, { label: measurementLabel(id, language) })}
                  </th>
                ))}
                <th scope="col">{copy.photos}</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((metric) => (
                <tr key={metric.id}>
                  <td>{formatDateOnly(metric.date, language)}</td>
                  <td>{metric.weight ?? '—'}</td>
                  {list.measurementIds.map((id) => (
                    <td key={id}>{metric.measurements[id] ?? '—'}</td>
                  ))}
                  <td>{metric.photos.length > 0 ? metric.photos.map((photo) => poseLabel(photo.pose, language)).join(', ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label={copy.progressPhotos}>
        <h3 className="body-tracking-heading">{copy.progressPhotos}</h3>
        <ProgressPhotos metrics={list.items} />
      </section>
    </div>
  );
}
