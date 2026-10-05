import { useNavigate } from 'react-router-dom';
import { DAY_NAMES, formatWeekRange, useLoad } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { useAuth } from '../../../../services/auth/AuthContext';
import { getWeek } from '../../../../services/plans/plansService';
import { workoutLogPath, workoutPath } from '../../../../app/config/routes';
import { StreakRing } from '../../../dashboard/components/StreakRing/StreakRing';
import { WorkoutRow } from '../../../workouts/components/WorkoutRow/WorkoutRow';
import { WORKOUT_STATUS_LABELS, exerciseCountLabel } from '../../../workouts/data/workoutCopy';
import { WeekStrip } from '../../components/WeekStrip/WeekStrip';
import { HOME_COPY } from '../../data/homeCopy';
import './HomePage.css';

// Trainee Home (PRD §5.1). Statuses and the next workout come from the server, which
// computes them in the trainee's time zone — nothing here reads the device clock.
export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: week, error, isLoading, reload } = useLoad(getWeek, HOME_COPY.loadError);

  const firstName = user?.name?.trim().split(' ')[0] ?? '';
  const plan = week?.plan;
  const nextWorkout = plan?.workouts.find((workout) => workout.id === week?.nextWorkoutId);

  return (
    <AppShell>
      <div className="home-page">
        <header className="home-header">
          <div className="home-header-text">
            <h1 className="home-greeting">{HOME_COPY.greeting(firstName)}</h1>
            {week && (
              <span className="home-week-range">
                {HOME_COPY.weekOf} {formatWeekRange(week.weekStartDate)}
              </span>
            )}
          </div>
          {/* Streak placeholder: the real value arrives with Phase 11. */}
          <div className="home-streak">
            <StreakRing streak={0} compact />
            <span className="home-streak-text">
              <span className="home-streak-label">{HOME_COPY.streak}</span>
              <span className="home-streak-note">{HOME_COPY.streakComingSoon}</span>
            </span>
          </div>
        </header>

        {isLoading && !week && <StateMessage>{HOME_COPY.loading}</StateMessage>}
        {error && !week && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {week && (
          <>
            <WeekStrip weekStartDate={week.weekStartDate} today={week.today} workouts={plan?.workouts ?? []} />

            {!plan && <StateMessage>{HOME_COPY.noPlanThisWeek}</StateMessage>}

            {plan && (
              <>
                <section className="home-next" aria-labelledby="home-next-title">
                  <h2 className="home-section-title" id="home-next-title">
                    {HOME_COPY.nextWorkout}
                  </h2>
                  {nextWorkout ? (
                    <>
                      <span className="home-next-name">{nextWorkout.title}</span>
                      <span className="home-next-meta">
                        {nextWorkout.dayOfWeek !== undefined && `${DAY_NAMES[nextWorkout.dayOfWeek]} · `}
                        {exerciseCountLabel(nextWorkout.exercises.length)}
                        {nextWorkout.inProgress && ` · ${WORKOUT_STATUS_LABELS.inProgress}`}
                        {!nextWorkout.inProgress && nextWorkout.status === 'missed' && ` · ${WORKOUT_STATUS_LABELS.missed}`}
                      </span>
                      <Button className="home-next-button" onClick={() => navigate(workoutPath(plan.id, nextWorkout.id))}>
                        {HOME_COPY.startNextWorkout}
                      </Button>
                    </>
                  ) : (
                    <p className="home-next-empty">
                      {plan.workouts.length === 0 ? HOME_COPY.noWorkoutsInPlan : HOME_COPY.allDone}
                    </p>
                  )}
                </section>

                {plan.workouts.length > 0 && (
                  <section aria-labelledby="home-week-title">
                    <h2 className="home-section-title home-section-title-ruled" id="home-week-title">
                      {HOME_COPY.thisWeek}
                    </h2>
                    <ul>
                      {plan.workouts.map((workout) => (
                        <li key={workout.id}>
                          <WorkoutRow
                            workout={workout}
                            to={workout.logId ? workoutLogPath(workout.logId) : workoutPath(plan.id, workout.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}

            {/* Achievements strip: empty until Phase 11 computes them. */}
            <section aria-labelledby="home-achievements-title">
              <h2 className="home-section-title home-section-title-ruled" id="home-achievements-title">
                {HOME_COPY.achievements}
              </h2>
              <StateMessage>{HOME_COPY.noAchievements}</StateMessage>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
