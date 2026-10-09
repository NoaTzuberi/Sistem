import type { TraineePlanWorkout, WorkoutStatus } from '@sistem/types';
import { addDaysToDate, dayName, useCopy, useLanguage, weekdayName } from '@sistem/shared';
import { workoutCopy } from '../../../workouts/copy';
import './WeekStrip.css';

const DAYS_IN_WEEK = 7;

interface WeekStripProps {
  /** The Sunday of the week and today, both from the server (trainee's time zone). */
  weekStartDate: string;
  today: string;
  workouts: TraineePlanWorkout[];
}

/** One mark for a day: missed if anything on it was missed, done only if everything is. */
function dayStatus(workouts: TraineePlanWorkout[]): WorkoutStatus | null {
  if (workouts.length === 0) return null;
  if (workouts.some((workout) => workout.status === 'missed')) return 'missed';
  return workouts.every((workout) => workout.status === 'done') ? 'done' : 'upcoming';
}

/**
 * Sunday–Saturday at a glance (the ATLAS WeekDotStrip, reworked for plan weeks):
 * a mark per day with a planned workout. Workouts without a day are not shown here.
 */
export function WeekStrip({ weekStartDate, today, workouts }: WeekStripProps) {
  const language = useLanguage();
  const copy = useCopy(workoutCopy);
  return (
    <ol className="week-strip">
      {Array.from({ length: DAYS_IN_WEEK }, (_, dayOfWeek) => {
        const status = dayStatus(workouts.filter((workout) => workout.dayOfWeek === dayOfWeek));
        const isToday = addDaysToDate(weekStartDate, dayOfWeek) === today;
        const label = `${dayName(dayOfWeek, language)}${status ? `: ${copy.status[status]}` : ''}`;

        return (
          <li
            key={dayOfWeek}
            className={'week-strip-day' + (isToday ? ' week-strip-day-today' : '')}
            aria-label={label}
            aria-current={isToday ? 'date' : undefined}
          >
            <span className="week-strip-letter" aria-hidden="true">
              {weekdayName(dayOfWeek, language, 'narrow')}
            </span>
            <span className={'week-strip-mark' + (status ? ` week-strip-mark-${status}` : '')} aria-hidden="true" />
          </li>
        );
      })}
    </ol>
  );
}
