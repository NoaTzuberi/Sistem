import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { measurementDays, measurementLabel, measurementPoints, useCopy, useLanguage } from '@sistem/shared';
import { IconPlus } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES, measurementsLogPath } from '../../../../app/config/routes';
import { MeasurementHistory } from '../../../bodyTracking/components/MeasurementHistory/MeasurementHistory';
import { MeasurementPicker } from '../../../bodyTracking/components/MeasurementPicker/MeasurementPicker';
import { TrendChart } from '../../../bodyTracking/components/TrendChart/TrendChart';
import { bodyCopy } from '../../../bodyTracking/copy';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { useMyBodyMetrics, useMyUnits } from '../../hooks/useMyBody';
import './MeasurementsPage.css';

// Body measurements over time (PRD §5.5): pick one for the chart; every day listed.
export function MeasurementsPage() {
  const language = useLanguage();
  const copy = useCopy(bodyCopy);
  const navigate = useNavigate();
  const { list, error, isLoading, reload } = useMyBodyMetrics();
  const { units, today } = useMyUnits();
  const [picked, setPicked] = useState<string | null>(null);
  // The first measurement she has logged, until she picks one.
  const firstLogged = list?.measurementIds.find((id) => measurementDays(list.items).some((day) => day.measurements[id] !== undefined));
  const measurementId = picked ?? firstLogged ?? list?.measurementIds[0] ?? '';

  return (
    <AppShell>
      <div className="measurements-page">
        <SubPageHeader
          title={copy.measurementsTitle}
          fallbackPath={ROUTES.PROFILE}
          action={
            <Button
              variant="secondary"
              icon={<IconPlus size={18} aria-hidden="true" />}
              aria-label={copy.logMeasurements}
              onClick={() => navigate(measurementsLogPath())}
            >
              {copy.logShort}
            </Button>
          }
        />

        {isLoading && !list && <StateMessage>{copy.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <>
            <MeasurementPicker ids={list.measurementIds} value={measurementId} onChange={setPicked} />
            <TrendChart
              key={measurementId}
              points={measurementPoints(list.items, measurementId, units.length)}
              unit={units.length}
              title={measurementLabel(measurementId, language)}
              today={today}
            />
            <MeasurementHistory
              metrics={list.items}
              measurementIds={list.measurementIds}
              unit={units.length}
              onEdit={(metric) => navigate(measurementsLogPath(metric.date))}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
