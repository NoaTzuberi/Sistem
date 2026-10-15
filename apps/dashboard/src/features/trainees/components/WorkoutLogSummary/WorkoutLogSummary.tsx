import { formatNumber, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { StatTile } from '../../../stats/components/StatTile/StatTile';
import { traineesCopy } from '../../copy';
import './WorkoutLogSummary.css';

interface WorkoutLogSummaryProps {
  count: number;
  thisWeek: number;
  averageRating: number | null;
  records: number;
}

/** Her logs in four numbers, on the statistics page's colored tiles. */
export function WorkoutLogSummary({ count, thisWeek, averageRating, records }: WorkoutLogSummaryProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const whole = (value: number) => formatNumber(value, language);
  return (
    <div className="logs-summary">
      <StatTile tone="pink" label={copy.logs.workouts} value={count} format={whole} intro={false} />
      <StatTile tone="purple" label={copy.thisWeek} value={thisWeek} format={whole} intro={false} />
      {/* The tile writes whole numbers: tenths go in as ×10 and are written back as one decimal. */}
      <StatTile
        tone="orange"
        label={copy.logs.averageRating}
        value={averageRating === null ? null : Math.round(averageRating * 10)}
        format={(tenths) => formatNumber(tenths / 10, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        intro={false}
      />
      <StatTile tone="blue" label={shared.coach.personalRecords} value={records} format={whole} intro={false} />
    </div>
  );
}
