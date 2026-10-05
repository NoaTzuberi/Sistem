import { Link } from 'react-router-dom';
import type { TraineePlan, TraineePlanWorkout } from '@sistem/types';
import { formatDateTime, formatDuration, formatWeekRange, useLoad } from '@sistem/shared';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { listPlans } from '../../../../services/plans/plansService';
import { listWorkoutLogs } from '../../../../services/workoutLogs/workoutLogsService';
import { workoutLogPath, workoutPath } from '../../../../app/config/routes';
import { WorkoutRow } from '../../components/WorkoutRow/WorkoutRow';
import { WORKOUTS_COPY, doneCountLabel } from '../../data/workoutCopy';
import './WorkoutsPage.css';

async function loadWorkouts() {
  const [plans, logs] = await Promise.all([listPlans(), listWorkoutLogs()]);
  return {
    current: plans.items.find((plan) => plan.period === 'current'),
    // Only next week; plans the coach published further ahead stay hidden until then.
    next: plans.items.find((plan) => plan.weekStartDate === plans.nextWeekStartDate),
    past: plans.items.filter((plan) => plan.period === 'past'),
    completedLogs: logs.filter((log) => log.status === 'completed'),
  };
}

/** A done workout opens its log. Otherwise it opens the workout while its week is still on. */
function rowTarget(plan: TraineePlan, workout: TraineePlanWorkout): string | undefined {
  if (workout.logId) return workoutLogPath(workout.logId);
  return plan.period === 'past' ? undefined : workoutPath(plan.id, workout.id);
}

function PlanWorkouts({ plan }: { plan: TraineePlan }) {
  if (plan.workouts.length === 0) return <StateMessage>{WORKOUTS_COPY.noWorkoutsInPlan}</StateMessage>;
  return (
    <ul className="workouts-rows">
      {plan.workouts.map((workout) => (
        <li key={workout.id}>
          <WorkoutRow workout={workout} to={rowTarget(plan, workout)} />
        </li>
      ))}
    </ul>
  );
}

// Trainee Workouts tab (PRD §5.4): this week, next week (when published), past weeks
// and completed logs.
export function WorkoutsPage() {
  const { data, error, isLoading, reload } = useLoad(loadWorkouts, WORKOUTS_COPY.loadError);

  return (
    <AppShell>
      <div className="workouts-page">
        <h1 className="workouts-title">{WORKOUTS_COPY.title}</h1>

        {isLoading && !data && <StateMessage>{WORKOUTS_COPY.loading}</StateMessage>}
        {error && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {data && (
          <>
            <section className="workouts-section" aria-labelledby="workouts-this-week">
              <h2 className="workouts-section-title" id="workouts-this-week">
                {WORKOUTS_COPY.thisWeek}
                {data.current && <span className="workouts-section-range"> · {formatWeekRange(data.current.weekStartDate)}</span>}
              </h2>
              {data.current ? (
                <PlanWorkouts plan={data.current} />
              ) : (
                <StateMessage>{WORKOUTS_COPY.noPlanThisWeek}</StateMessage>
              )}
            </section>

            {data.next && (
              <section className="workouts-section" aria-labelledby="workouts-next-week">
                <h2 className="workouts-section-title" id="workouts-next-week">
                  {WORKOUTS_COPY.nextWeek}
                  <span className="workouts-section-range"> · {formatWeekRange(data.next.weekStartDate)}</span>
                </h2>
                <PlanWorkouts plan={data.next} />
              </section>
            )}

            <section className="workouts-section" aria-labelledby="workouts-past-weeks">
              <h2 className="workouts-section-title" id="workouts-past-weeks">
                {WORKOUTS_COPY.pastWeeks}
              </h2>
              {data.past.length === 0 && <StateMessage>{WORKOUTS_COPY.noPastWeeks}</StateMessage>}
              {data.past.map((plan) => (
                <details key={plan.id} className="workouts-week">
                  <summary className="workouts-week-summary">
                    <span className="workouts-week-range">{formatWeekRange(plan.weekStartDate)}</span>
                    <span className="workouts-week-count">{doneCountLabel(plan.workouts)}</span>
                    <IconChevronDown className="workouts-week-chevron" size={20} aria-hidden="true" />
                  </summary>
                  <PlanWorkouts plan={plan} />
                </details>
              ))}
            </section>

            <section className="workouts-section" aria-labelledby="workouts-logs">
              <h2 className="workouts-section-title" id="workouts-logs">
                {WORKOUTS_COPY.completedLogs}
              </h2>
              {data.completedLogs.length === 0 && <StateMessage>{WORKOUTS_COPY.noCompletedLogs}</StateMessage>}
              <ul className="workouts-rows">
                {data.completedLogs.map((log) => (
                  <li key={log.id}>
                    <Link className="workouts-log-row" to={workoutLogPath(log.id)}>
                      <span className="workouts-log-main">
                        <span className="workouts-log-title">{log.workoutTitle}</span>
                        <span className="workouts-log-meta">
                          {formatDateTime(log.finishedAt ?? log.startedAt)}
                          {log.stats && ` · ${formatDuration(log.stats.durationSec)}`}
                        </span>
                      </span>
                      <IconChevronRight className="workouts-log-chevron" size={20} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
