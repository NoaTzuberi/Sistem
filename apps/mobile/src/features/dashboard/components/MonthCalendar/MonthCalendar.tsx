import { getCategoryIcon } from '../../../workouts/data/categoryVisuals';
import type { WorkoutCategory } from '../../../workouts/types';
import './MonthCalendar.css';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Only days with a logged workout have an entry. */
export interface DayLogInfo {
  /** 1 = workout logged, 2 = workout volume in the top tier for the month. */
  volumeTier: 1 | 2;
  workoutCategory?: WorkoutCategory;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  dayLogs: Map<string, DayLogInfo>;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthCalendar({
  year,
  month,
  dayLogs,
  selectedDateKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const todayKey = toDateKey(new Date());

  const cells: Array<{ day: number; dateKey: string } | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return { day: i + 1, dateKey: toDateKey(date) };
    }),
  ];

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <button type="button" onClick={onPrevMonth} aria-label="Previous month">
          &larr;
        </button>
        <h3>
          {MONTH_LABELS[month]} {year}
        </h3>
        <button type="button" onClick={onNextMonth} aria-label="Next month">
          &rarr;
        </button>
      </div>

      <div className="month-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="month-calendar-grid">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`blank-${index}`} className="month-calendar-cell month-calendar-cell-blank" />;
          }

          const log = dayLogs.get(cell.dateKey);
          const isToday = cell.dateKey === todayKey;
          const isSelected = cell.dateKey === selectedDateKey;

          const classNames = [
            'month-calendar-cell',
            log ? `month-calendar-cell-tier-${log.volumeTier}` : '',
            isToday ? 'month-calendar-cell-today' : '',
            isSelected ? 'month-calendar-cell-selected' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const CategoryIcon = log?.workoutCategory ? getCategoryIcon(log.workoutCategory) : null;

          return (
            <button
              key={cell.dateKey}
              type="button"
              className={classNames}
              onClick={() => onSelectDate(cell.dateKey)}
            >
              <span className="month-calendar-day">{cell.day}</span>
              {CategoryIcon && (
                <span className="month-calendar-icon" aria-hidden="true">
                  <CategoryIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
