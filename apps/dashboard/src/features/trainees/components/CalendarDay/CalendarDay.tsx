import type { ReactNode } from 'react';
import { useCopy } from '@sistem/shared';
import { traineesCopy } from '../../copy';
import './CalendarDay.css';

interface CalendarDayProps {
  /** "א׳" / "Sun". */
  dayName: string;
  /** "12.10". */
  date: string;
  isToday: boolean;
  /** The day's workouts; none = a rest day. */
  children?: ReactNode;
}

/** One day column of the week calendar: its name and date, today tinted, then its workouts — or "rest". */
export function CalendarDay({ dayName, date, isToday, children }: CalendarDayProps) {
  const copy = useCopy(traineesCopy);
  const hasWorkouts = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="pw-day" data-today={isToday || undefined} role="listitem">
      <span className="pw-day-head">
        <b className="pw-day-name">{dayName}</b>
        <span className="pw-day-date">
          <bdi>{date}</bdi>
        </span>
        {isToday && <span className="pw-day-today">{copy.weeks.today}</span>}
      </span>
      <div className="pw-day-body">{hasWorkouts ? children : <span className="pw-day-rest">{copy.weeks.rest}</span>}</div>
    </div>
  );
}
