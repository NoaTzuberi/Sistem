import type { ReactNode } from 'react';
import { fill, formatNumber, formatPlural, formatWeekSpan, isolateLtr, useCopy, useLanguage } from '@sistem/shared';
import { planName } from '../../data/planWeeks';
import { traineesCopy } from '../../copy';
import type { ProgramWeek } from '../../hooks/useTraineeWeeks';
import './WeekInfo.css';

const SIZE = 124;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;

interface WeekInfoProps {
  week: ProgramWeek & { plan: NonNullable<ProgramWeek['plan']> };
  traineeName: string;
  /** Days until a future week starts. */
  startsInDays: number | null;
  /** The actions for this week's state. */
  actions: ReactNode;
}

/** The selected week's facts: its number and state, name, dates, the completion ring, a draft's warning, and what to do. */
export function WeekInfo({ week, traineeName, startsInDays, actions }: WeekInfoProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const w = copy.weeks;
  const { plan } = week;
  const span = formatWeekSpan(plan.weekStartDate, language);
  const name = planName(plan, language) ?? span;
  const isDraft = plan.status === 'draft';
  const status = isDraft ? w.statusDraft : week.time === 'past' ? w.statusEnded : w.statusLive;
  const fraction = week.completion ?? 0;
  const progress = week.progress;

  return (
    <div className="pw-info">
      <p className="pw-info-eyebrow">
        <span>{fill(w.week, { number: week.number })}</span>
        <span className="pw-info-status" data-status={isDraft ? 'draft' : week.time}>
          {status}
        </span>
      </p>
      <h2 className="pw-info-name">
        <bdi>{name}</bdi>
      </h2>
      <p className="pw-info-sub">
        {[name === span ? null : span, formatPlural(language, w.workoutsCount, plan.workouts.length)].filter(Boolean).join(' · ')}
      </p>

      <div className="pw-info-ring" role="img" aria-label={progress ? fill(w.doneOf, { done: progress.completed, planned: progress.planned }) : w.notStarted}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="pw-info-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
          {/* Nothing is drawn at 0 — a round cap would still leave a dot. */}
          {fraction > 0 && (
            <circle
              className="pw-info-ring-value"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              pathLength={100}
              strokeDasharray={`${(fraction * 100).toFixed(1)} 100`}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          )}
        </svg>
        <span className="pw-info-ring-text" aria-hidden="true">
          <b>{progress ? isolateLtr(formatNumber(fraction, language, { style: 'percent', maximumFractionDigits: 0 })) : '—'}</b>
          <small>{progress ? fill(w.doneOf, { done: progress.completed, planned: progress.planned }) : w.notStarted}</small>
        </span>
      </div>

      {isDraft && (
        <p className="pw-info-warning">
          {fill(copy.notPublishedNote, { name: traineeName })}
          {startsInDays !== null && startsInDays > 0 && ` ${formatPlural(language, w.startsIn, startsInDays)}`}
        </p>
      )}
      <div className="pw-info-actions">{actions}</div>
    </div>
  );
}
