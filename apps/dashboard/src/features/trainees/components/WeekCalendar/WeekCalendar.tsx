import type { CoachPlan, WorkoutStatus } from '@sistem/types';
import { addDaysToDate, dateFormat, useCopy, useLanguage } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { traineesCopy } from '../../copy';
import { CalendarDay } from '../CalendarDay/CalendarDay';
import { CalendarWorkout } from '../CalendarWorkout/CalendarWorkout';
import './WeekCalendar.css';

interface WeekCalendarProps {
  traineeId: string;
  plan: CoachPlan;
  /** Her today ('YYYY-MM-DD', her zone). */
  today: string;
}

const parseDay = (date: string) => new Date(`${date}T00:00:00Z`);

/** The selected week as seven days (Sunday first, in reading order); workouts without a set day are listed after them. */
export function WeekCalendar({ traineeId, plan, today }: WeekCalendarProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const to = planPath(traineeId, plan.id);
  const statusOf = (workoutId: string): WorkoutStatus | 'draft' => (plan.status === 'draft' ? 'draft' : (plan.progress?.statuses[workoutId] ?? 'upcoming'));
  const indexed = plan.workouts.map((workout, index) => ({ workout, index }));
  const scheduled = indexed.some(({ workout }) => workout.dayOfWeek !== undefined);
  const unscheduled = indexed.filter(({ workout }) => workout.dayOfWeek === undefined);
  const block = ({ workout, index }: (typeof indexed)[number]) => (
    <CalendarWorkout key={workout.id} workout={workout} index={index} status={statusOf(workout.id)} to={to} />
  );

  return (
    <div className="pw-calendar" aria-label={copy.weeks.calendarLabel}>
      {scheduled && (
        <div className="pw-calendar-days" role="list">
          {Array.from({ length: 7 }, (_, day) => {
            const date = addDaysToDate(plan.weekStartDate, day);
            return (
              <CalendarDay
                key={date}
                dayName={dateFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(parseDay(date))}
                date={dateFormat(language, { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(parseDay(date))}
                isToday={date === today}
              >
                {indexed.filter(({ workout }) => workout.dayOfWeek === day).map(block)}
              </CalendarDay>
            );
          })}
        </div>
      )}
      {unscheduled.length > 0 && (
        <div className="pw-calendar-free">
          <h3 className="pw-calendar-free-title">{copy.weeks.noFixedDay}</h3>
          <div className="pw-calendar-free-list">{unscheduled.map(block)}</div>
        </div>
      )}
    </div>
  );
}
