import type { CSSProperties } from 'react';
import { fill, formatNumber, isolateLtr, useCopy, useLanguage } from '@sistem/shared';
import { traineesCopy } from '../../copy';
import type { ProgramWeek } from '../../hooks/useTraineeWeeks';
import './ConsistencyCard.css';

interface ConsistencyCardProps {
  weeks: ProgramWeek[];
  selected: string;
  onSelect: (weekStartDate: string) => void;
}

/** How she kept up over the program: four numbers, then a column per published week (a press selects that week). */
export function ConsistencyCard({ weeks, selected, onSelect }: ConsistencyCardProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const w = copy.weeks;
  // The weeks that ran (published, up to this week).
  const ran = weeks.filter((week) => week.status === 'published' && week.time !== 'future' && week.progress);
  const ended = ran.filter((week) => week.time === 'past');
  const average = ended.length > 0 ? ended.reduce((sum, week) => sum + (week.completion ?? 0), 0) / ended.length : null;
  const percent = (value: number) => isolateLtr(formatNumber(value, language, { style: 'percent', maximumFractionDigits: 0 }));
  if (ran.length === 0) return null;

  const stats = [
    { id: 'weeks', label: w.weeksInPlan, value: formatNumber(ran.length, language) },
    { id: 'average', label: w.averageDone, value: average === null ? '—' : percent(average) },
    { id: 'full', label: w.fullWeeks, value: formatNumber(ended.filter((week) => week.completion === 1).length, language) },
    { id: 'done', label: w.workoutsDone, value: formatNumber(ran.reduce((sum, week) => sum + (week.progress?.completed ?? 0), 0), language) },
  ];

  return (
    <section className="pw-consistency" aria-labelledby="pw-consistency-title">
      <h2 className="pw-consistency-title" id="pw-consistency-title">
        {w.consistencyTitle}
      </h2>
      <dl className="pw-consistency-stats">
        {stats.map((stat) => (
          <div key={stat.id} className="pw-consistency-stat" data-stat={stat.id}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="pw-chart" role="group" aria-label={w.chartLabel}>
        {ran.map((week) => {
          const completion = week.completion ?? 0;
          const kind = week.time === 'current' ? 'current' : completion === 1 ? 'full' : 'part';
          return (
            <button
              key={week.weekStartDate}
              className="pw-chart-column"
              type="button"
              data-kind={kind}
              aria-pressed={week.weekStartDate === selected}
              aria-label={`${fill(w.week, { number: week.number })}: ${percent(completion)}`}
              onClick={() => onSelect(week.weekStartDate)}
            >
              <span className="pw-chart-value" aria-hidden="true">
                {percent(completion)}
              </span>
              {/* A computed value: the bar's height is the week's completion. */}
              <span className="pw-chart-track" aria-hidden="true">
                <span className="pw-chart-bar" style={{ '--pw-height': `${Math.max(completion, 0.02) * 100}%` } as CSSProperties} />
              </span>
              <span className="pw-chart-label" aria-hidden="true">
                {fill(w.week, { number: week.number })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
