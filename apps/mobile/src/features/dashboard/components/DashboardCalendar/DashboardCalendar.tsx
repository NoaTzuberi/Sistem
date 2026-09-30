import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { MonthCalendar, toDateKey } from '../MonthCalendar/MonthCalendar';
import type { DayLogInfo } from '../MonthCalendar/MonthCalendar';
import { listWorkouts } from '../../../../services/workouts/workoutSessionService';
import { CalendarIcon } from '../icons';
import type { WorkoutSummary } from '../../../workouts/types';
import './DashboardCalendar.css';

function startOfMonthPadded(year: number, month: number): string {
  const date = new Date(year, month, -1);
  return date.toISOString();
}

function endOfMonthPadded(year: number, month: number): string {
  const date = new Date(year, month + 1, 2);
  return date.toISOString();
}

export function DashboardCalendar() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));

  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  async function loadMonth() {
    setIsLoading(true);
    setLoadError(undefined);
    try {
      const from = startOfMonthPadded(year, month);
      const to = endOfMonthPadded(year, month);
      setWorkouts(await listWorkouts({ from, to, status: 'completed' }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load your calendar.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // One heat-map tier per day: aggregate same-day workout volume and keep the
  // first category logged that day for the cell icon.
  const dayLogs = useMemo(() => {
    const volumeByDay = new Map<string, number>();
    const categoryByDay = new Map<string, WorkoutSummary['category']>();
    for (const w of workouts) {
      const key = toDateKey(new Date(w.date));
      volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + (w.totalVolume ?? 0));
      if (!categoryByDay.has(key)) categoryByDay.set(key, w.category);
    }
    const maxVolume = Math.max(0, ...volumeByDay.values());

    const map = new Map<string, DayLogInfo>();
    for (const [key, volume] of volumeByDay) {
      map.set(key, {
        volumeTier: maxVolume > 0 && volume >= maxVolume * 0.6 ? 2 : 1,
        workoutCategory: categoryByDay.get(key),
      });
    }
    return map;
  }, [workouts]);

  const selectedWorkouts = workouts.filter((w) => toDateKey(new Date(w.date)) === selectedDateKey);

  function goToPrevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <GlassCard variant="flat" className="dashboard-calendar">
      <div className="dashboard-calendar-header">
        <span className="dashboard-calendar-label">Calendar</span>
      </div>

      {isLoading && (
        <div className="dashboard-calendar-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && loadError && <p className="dashboard-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="dashboard-calendar-layout">
          <MonthCalendar
            year={year}
            month={month}
            dayLogs={dayLogs}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
          />

          <div className="dashboard-calendar-day">
            <div className="dashboard-calendar-month-summary">
              <div className="dashboard-calendar-month-summary-stat">
                <span className="dashboard-calendar-month-summary-value">{workouts.length}</span>
                <span className="dashboard-calendar-month-summary-label">
                  Workout{workouts.length === 1 ? '' : 's'} this month
                </span>
              </div>
            </div>

            <h3>{selectedDateKey}</h3>

            {selectedWorkouts.length === 0 && (
              <div className="dashboard-calendar-day-empty">
                <span className="dashboard-calendar-day-empty-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>
                <p className="text-body">Nothing logged this day.</p>
              </div>
            )}

            {selectedWorkouts.map((workout) => (
              <div key={workout.id} className="dashboard-calendar-day-entry">
                <span className="dashboard-calendar-day-entry-icon" aria-hidden="true">
                  🏋
                </span>
                <div>
                  <span className="dashboard-calendar-day-entry-title">{workout.name}</span>
                  <span className="dashboard-calendar-day-entry-meta text-caption">
                    {workout.duration ? `${workout.duration} min` : ''}
                    {workout.totalVolume ? ` — ${workout.totalVolume}kg volume` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
