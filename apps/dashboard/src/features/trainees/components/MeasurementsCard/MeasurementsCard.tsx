import type { BodyMetric } from '@sistem/types';
import { fill, formatNumber, formatPlural, formatSignedChange, measurementDays, measurementLabel, measurementPoints, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Sparkline } from '../../../stats/components/Sparkline/Sparkline';
import { measureColorClass, measurementSeries } from '../../data/bodySummary';
import { useMeasurementPicker } from '../../hooks/useMeasurementPicker';
import { useRadioGroupKeys } from '../../hooks/useRadioGroupKeys';
import { BodyAreaChart } from '../BodyAreaChart/BodyAreaChart';
import { StripedEmpty } from '../StripedEmpty/StripedEmpty';
import { TabCard } from '../TabCard/TabCard';
import { traineesCopy } from '../../copy';
import './MeasurementsCard.css';

interface MeasurementsCardProps {
  metrics: BodyMetric[];
  /** The measurements that can be logged, in display order (from the server). */
  measurementIds: string[];
  intro: boolean;
}

/** Her circumference measurements: the chosen one's chart over a row per measurement (its color, shape, latest value, change). */
export function MeasurementsCard({ metrics, measurementIds, intro }: MeasurementsCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const series = measurementSeries(metrics, measurementIds);
  const { selected, select } = useMeasurementPicker(series);
  const handleKeys = useRadioGroupKeys();
  const days = measurementDays(metrics).length;
  const cm = shared.units.cm;

  if (days === 0 || !selected) {
    return (
      <TabCard className="measurements-card" title={copy.body.measurementsTitle} subtitle={measurementIds.map((id) => measurementLabel(id, language)).join(shared.common.listSeparator)}>
        <StripedEmpty icon="ruler" text={copy.body.noMeasurements} />
      </TabCard>
    );
  }

  const points = measurementPoints(metrics, selected.id, 'cm');
  const selectedLabel = measurementLabel(selected.id, language);

  return (
    <TabCard
      className="measurements-card"
      title={copy.body.measurementsTitle}
      subtitle={`${selectedLabel} · ${formatPlural(language, copy.body.measurementCount, days)}`}
    >
      <div className={`measurements-card-chart ${measureColorClass(selected.id)}`}>
        {points.length >= 2 ? (
          <BodyAreaChart key={selected.id} points={points} unit="cm" label={fill(copy.overTime, { title: selectedLabel })} intro={intro} size="small" />
        ) : (
          <StripedEmpty icon="trend" text={copy.body.trendAfterSecond} size="small" />
        )}
      </div>
      <div className="measurements-card-rows" role="radiogroup" aria-label={copy.measurement} onKeyDown={handleKeys}>
        {series.map((entry) => {
          const isSelected = entry.id === selected.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className={`measurements-card-row ${measureColorClass(entry.id)}`}
              onClick={() => select(entry.id)}
            >
              <span className="measurements-card-dot" aria-hidden="true" />
              <span className="measurements-card-name">{measurementLabel(entry.id, language)}</span>
              <span className="measurements-card-spark">{entry.values.length >= 2 && <Sparkline values={entry.values} />}</span>
              <span className="measurements-card-value">
                {entry.latest === null ? (
                  <span className="measurements-card-none">—</span>
                ) : (
                  <>
                    <bdi>{formatNumber(entry.latest, language)}</bdi> <small>{cm}</small>
                  </>
                )}
              </span>
              <span className="measurements-card-change">{entry.change !== null && formatSignedChange(entry.change, 'cm', language)}</span>
            </button>
          );
        })}
      </div>
    </TabCard>
  );
}
