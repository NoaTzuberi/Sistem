import type { CSSProperties } from 'react';
import type { PortionGroup } from '@sistem/types';
import { formatPortionCount, isolateLtr, PORTION_GROUPS, useCopy, useI18n } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionCopy } from '../../copy';
import type { TrackedDay } from '../../hooks/usePortionTracking';
import './DayPortionCard.css';

interface DayPortionCardProps {
  entry: TrackedDay;
  /** "א׳", "Sun". */
  dayLetter: string;
  /** "11.10". */
  date: string;
  isOpen: boolean;
  onOpen: () => void;
}

/** One day of her week: four thin bars (marked of the day's goal), the day's total, meal photos — or why there is nothing. */
export function DayPortionCard({ entry, dayLetter, date, isOpen, onOpen }: DayPortionCardProps) {
  const copy = useCopy(nutritionCopy);
  const { plural } = useI18n();
  const { day, state } = entry;
  const showBars = state === 'today' || state === 'marked';
  const muted = state === 'future' ? copy.trackingNotYet : state === 'no_plan' ? copy.trackingNoPlan : state === 'not_marked' ? copy.trackingNotMarked : null;

  const body = (
    <>
      <span className="nb-day-top">
        <span className="nb-day-letter">{dayLetter}</span>
        <span className="nb-day-date">
          <bdi>{date}</bdi>
        </span>
        {entry.isToday && <span className="nb-day-today">{copy.tracking.today}</span>}
      </span>
      {showBars ? (
        <span className="nb-day-bars" aria-hidden="true">
          {PORTION_GROUPS.map((group: PortionGroup) => (
            // A computed value: how much of the day's goal of this group she marked.
            <span key={group} className="nb-day-bar" data-group={group}>
              <span className="nb-day-bar-fill" style={{ '--nb-share': `${day.planned[group] > 0 ? Math.min(1, day.eaten[group] / day.planned[group]) * 100 : 0}%` } as CSSProperties} />
            </span>
          ))}
        </span>
      ) : (
        <span className="nb-day-muted">{muted}</span>
      )}
      {showBars && (
        <b className="nb-day-total">{isolateLtr(`${formatPortionCount(entry.eaten)} / ${formatPortionCount(entry.planned)}`)}</b>
      )}
      {day.photos.length > 0 && (
        <span className="nb-day-photos">
          <Icon name="spark" size="sm" />
          {plural(copy.tracking.photos, day.photos.length)}
        </span>
      )}
    </>
  );

  if (!entry.hasDetails) {
    return (
      <div className="nb-day" data-state={state} data-today={entry.isToday || undefined}>
        {body}
      </div>
    );
  }
  return (
    <button
      className="nb-day nb-day-button"
      type="button"
      data-state={state}
      data-today={entry.isToday || undefined}
      aria-expanded={isOpen}
      aria-label={`${copy.tracking.openDay}: ${dayLetter} ${date}`}
      onClick={onOpen}
    >
      {body}
    </button>
  );
}
