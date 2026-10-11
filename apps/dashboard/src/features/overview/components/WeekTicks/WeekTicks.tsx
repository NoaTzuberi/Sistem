import type { CoachStatsWeek } from '@sistem/types';
import { formatWeekSpan, useLanguage } from '@sistem/shared';
import { formatShare } from '../../data/overviewFormat';
import './WeekTicks.css';

interface WeekTicksProps {
  /** Oldest first; the last one is the current week. */
  weeks: CoachStatsWeek[];
  /** What the row shows, for screen readers and as its caption. */
  label: string;
}

const MIN_HEIGHT_PX = 4;
const MAX_HEIGHT_PX = 34;

/** A mini column per week: its height is the share of that week's planned workouts that were done. */
export function WeekTicks({ weeks, label }: WeekTicksProps) {
  const language = useLanguage();
  return (
    <figure className="week-ticks">
      <div className="week-ticks-row" role="img" aria-label={label}>
        {weeks.map((week, index) => {
          const share = week.planned > 0 ? week.completed / week.planned : 0;
          const text = formatShare(week.completed, week.planned, language);
          return (
            <span
              key={week.weekStartDate}
              className={index === weeks.length - 1 ? 'week-tick week-tick-current' : 'week-tick'}
              title={[formatWeekSpan(week.weekStartDate, language), text].filter(Boolean).join(' · ')}
              // A computed value: the column's height is the data.
              style={{ height: MIN_HEIGHT_PX + share * (MAX_HEIGHT_PX - MIN_HEIGHT_PX) }}
            />
          );
        })}
      </div>
      <figcaption className="week-ticks-caption">{label}</figcaption>
    </figure>
  );
}
