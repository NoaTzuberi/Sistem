import { fill, formatDayMonth, formatNumber, formatPlural, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { StatTile } from '../../../stats/components/StatTile/StatTile';
import type { BodySummary } from '../../data/bodySummary';
import { signedNumber } from '../../data/bodySummary';
import { traineesCopy } from '../../copy';
import './BodySummaryTiles.css';

interface BodySummaryTilesProps {
  summary: BodySummary;
  /** The numbers count up (first view only). */
  intro: boolean;
}

// The tiles count whole numbers up; a weight keeps its tenth by counting tenths.
const TENTHS = 10;

/** The Body tab's four numbers, in the Statistics tiles: current weight, change since the start, measurements, photos. */
export function BodySummaryTiles({ summary, intro }: BodySummaryTilesProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy).body;
  const kg = shared.units.kg;
  const tenths = (value: number) => formatNumber(value / TENTHS, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const { latestWeight, sinceStart, measurements, photos } = summary;

  return (
    <div className="body-summary-tiles">
      <StatTile
        tone="pink"
        label={copy.currentWeight}
        value={latestWeight ? Math.round(latestWeight.kg * TENTHS) : null}
        format={tenths}
        unit={kg}
        delta={
          latestWeight?.change
            ? { direction: latestWeight.change > 0 ? 'up' : 'down', text: formatNumber(Math.abs(latestWeight.change), language) }
            : null
        }
        note={
          latestWeight
            ? latestWeight.change === null
              ? `${formatDayMonth(latestWeight.date, language)} · ${copy.firstRecord}`
              : formatDayMonth(latestWeight.date, language)
            : undefined
        }
        intro={intro}
      />
      <StatTile
        tone="purple"
        label={copy.sinceStart}
        value={sinceStart ? Math.round(sinceStart.change * TENTHS) : null}
        format={(value) => signedNumber(value / TENTHS, language)}
        unit={kg}
        note={
          sinceStart
            ? fill(copy.sinceStartNote, {
                date: formatDayMonth(sinceStart.fromDate, language),
                weeks: formatPlural(language, copy.weeks, sinceStart.weeks),
              })
            : copy.needTwoRecords
        }
        intro={intro}
      />
      <StatTile
        tone="orange"
        label={copy.measurements}
        value={measurements.count}
        format={(value) => formatNumber(value, language)}
        note={measurements.lastDate ? fill(copy.lastOn, { date: formatDayMonth(measurements.lastDate, language) }) : copy.measurementsNone}
        intro={intro}
      />
      <StatTile
        tone="blue"
        label={copy.photos}
        value={photos.count}
        format={(value) => formatNumber(value, language)}
        note={photos.lastDate ? fill(copy.lastOn, { date: formatDayMonth(photos.lastDate, language) }) : copy.photosNone}
        intro={intro}
      />
    </div>
  );
}
