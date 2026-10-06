import { useCallback, useState } from 'react';
import {
  DEFAULT_UNITS,
  measurementDays,
  measurementLabel,
  measurementPoints,
  photoDays,
  todayInTimezone,
  weightPoints,
} from '@sistem/shared';
import { listTraineeBodyMetrics } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { useBodyMetrics } from '../../../bodyTracking/hooks/useBodyMetrics';
import { TrendChart } from '../../../bodyTracking/components/TrendChart/TrendChart';
import { WeightHistory } from '../../../bodyTracking/components/WeightHistory/WeightHistory';
import { MeasurementPicker } from '../../../bodyTracking/components/MeasurementPicker/MeasurementPicker';
import { MeasurementHistory } from '../../../bodyTracking/components/MeasurementHistory/MeasurementHistory';
import { ProgressPhotoGallery } from '../../../bodyTracking/components/ProgressPhotoGallery/ProgressPhotoGallery';
import { PhotoCompare } from '../../../bodyTracking/components/PhotoCompare/PhotoCompare';
import { BODY_COPY } from '../../../bodyTracking/data/bodyCopy';
import './TraineeBodyTracking.css';

interface TraineeBodyTrackingProps {
  traineeId: string;
  /** The trainee's time zone: chart ranges end on her today. */
  timezone: string;
}

/**
 * The Body tab (coach mode): the trainee's weight, measurements and progress photos —
 * the same views she has, read-only, in kg / cm.
 */
export function TraineeBodyTracking({ traineeId, timezone }: TraineeBodyTrackingProps) {
  const load = useCallback(() => listTraineeBodyMetrics(traineeId), [traineeId]);
  const { list, error, isLoading, reload } = useBodyMetrics(load, BODY_COPY.coachLoadError);
  const [picked, setPicked] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const units = DEFAULT_UNITS;
  const today = todayInTimezone(timezone);

  if (isLoading && !list) return <StateMessage>{BODY_COPY.loading}</StateMessage>;
  if (!list) return <StateMessage onRetry={reload}>{error}</StateMessage>;

  const firstLogged = list.measurementIds.find((id) => measurementDays(list.items).some((day) => day.measurements[id] !== undefined));
  const measurementId = picked ?? firstLogged ?? list.measurementIds[0] ?? '';
  const canCompare = photoDays(list.items).length >= 2;

  return (
    <div className="trainee-body-tracking">
      <section className="trainee-body-tracking-section">
        <h2 className="trainee-body-tracking-title">{BODY_COPY.weightTitle}</h2>
        <TrendChart points={weightPoints(list.items, units.weight)} unit={units.weight} title={BODY_COPY.weightTitle} today={today} />
        <WeightHistory metrics={list.items} unit={units.weight} />
      </section>

      <section className="trainee-body-tracking-section">
        <h2 className="trainee-body-tracking-title">{BODY_COPY.measurementsTitle}</h2>
        <MeasurementPicker ids={list.measurementIds} value={measurementId} onChange={setPicked} />
        <TrendChart
          key={measurementId}
          points={measurementPoints(list.items, measurementId, units.length)}
          unit={units.length}
          title={measurementLabel(measurementId)}
          today={today}
        />
        <MeasurementHistory metrics={list.items} measurementIds={list.measurementIds} unit={units.length} />
      </section>

      <section className="trainee-body-tracking-section">
        <h2 className="trainee-body-tracking-title">{BODY_COPY.photosTitle}</h2>
        {canCompare && (
          <Button variant="secondary" aria-pressed={isComparing} onClick={() => setIsComparing((value) => !value)}>
            {isComparing ? BODY_COPY.close : BODY_COPY.compare}
          </Button>
        )}
        {isComparing && <PhotoCompare metrics={list.items} weightUnit={units.weight} onLinkExpired={reload} />}
        <ProgressPhotoGallery metrics={list.items} onLinkExpired={reload} />
      </section>
    </div>
  );
}
