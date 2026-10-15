import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dayName, fill, formatWeekRange, useCopy, useI18n, useLanguage, useLoad } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { useAuth } from '../../../../services/auth/AuthContext';
import { getWeek } from '../../../../services/plans/plansService';
import { ROUTES, workoutLogPath, workoutPath, workoutSessionPath } from '../../../../app/config/routes';
import { StreakRing } from '../../../achievements/components/StreakRing/StreakRing';
import { AchievementStrip } from '../../../achievements/components/AchievementStrip/AchievementStrip';
import { useMyAchievements } from '../../../achievements/hooks/useMyAchievements';
import { celebrate } from '../../../achievements/celebration';
import { achievementCopy } from '../../../achievements/copy';
import { WorkoutRow } from '../../../workouts/components/WorkoutRow/WorkoutRow';
import { exerciseCountLabel } from '../../../workouts/data/workoutDisplay';
import { workoutCopy } from '../../../workouts/copy';
import { useStartWorkout } from '../../../workouts/hooks/useStartWorkout';
import { StartConflictModal } from '../../../workouts/components/StartConflictModal/StartConflictModal';
import { WeekStrip } from '../../components/WeekStrip/WeekStrip';
import { StartingPhotoReminder } from '../../components/StartingPhotoReminder/StartingPhotoReminder';
import { useStartingPhotoReminder } from '../../hooks/useStartingPhotoReminder';
import { homeCopy } from '../../copy';
import './HomePage.css';

// Trainee Home (PRD §5.1). Statuses and the next workout come from the server, which
// computes them in the trainee's time zone — nothing here reads the device clock.
export function HomePage() {
  const language = useLanguage();
  const workoutText = useCopy(workoutCopy);
  const { plural } = useI18n();
  const achievementText = useCopy(achievementCopy);
  const copy = useCopy(homeCopy);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: week, error, isLoading, reload } = useLoad(getWeek, copy.loadError);
  const starter = useStartWorkout();
  const { data: achievements } = useMyAchievements();
  const startingPhotoReminder = useStartingPhotoReminder();

  // Anything not celebrated yet (a skipped summary, an unlock on another device) gets its moment here.
  useEffect(() => {
    if (achievements) celebrate(achievements.unlocked);
  }, [achievements]);

  const firstName = user?.name?.trim().split(' ')[0] ?? '';
  const plan = week?.plan;
  const nextWorkout = plan?.workouts.find((workout) => workout.id === week?.nextWorkoutId);
  const activeLog = week?.activeLog ?? null;

  // One tap (owner decision): resume the open workout, else start the next one.
  function handleStartNext() {
    if (activeLog) navigate(workoutSessionPath(activeLog.logId));
    else if (plan && nextWorkout) void starter.start(plan.id, nextWorkout.id);
  }

  return (
    <AppShell>
      <div className="home-page">
        <header className="home-header">
          <div className="home-header-text">
            <h1 className="home-greeting">{fill(copy.greeting, { firstName })}</h1>
            {week && (
              <span className="home-week-range">
                {copy.weekOf} {formatWeekRange(week.weekStartDate, language)}
              </span>
            )}
          </div>
          {/* Weekly plan streak (Phase 11): weeks in the middle, this week's workouts on the ring. */}
          {achievements && (
            <div className="home-streak">
              <StreakRing streak={achievements.streak} />
              <span className="home-streak-text">
                <span className="home-streak-label">{achievementText.streak}</span>
                <span className="home-streak-note">{plural(achievementText.streakUnit, achievements.streak.current)}</span>
              </span>
            </div>
          )}
        </header>

        {isLoading && !week && <StateMessage>{copy.loading}</StateMessage>}
        {error && !week && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {week && (
          <>
            {startingPhotoReminder.isVisible && (
              <StartingPhotoReminder
                onAdd={() => navigate(ROUTES.PROFILE_PHOTOS)}
                onDismiss={startingPhotoReminder.dismiss}
              />
            )}
            <WeekStrip weekStartDate={week.weekStartDate} today={week.today} workouts={plan?.workouts ?? []} />

            {!plan && <StateMessage>{copy.noPlanThisWeek}</StateMessage>}
            {!plan && activeLog && (
              <Button className="home-next-button" onClick={handleStartNext}>
                {fill(copy.resumeWorkout, { title: activeLog.workoutTitle })}
              </Button>
            )}

            {plan && (
              <>
                <section className="home-next" aria-labelledby="home-next-title">
                  <h2 className="home-section-title" id="home-next-title">
                    {copy.nextWorkout}
                  </h2>
                  {nextWorkout ? (
                    <>
                      <span className="home-next-name" dir="auto">{nextWorkout.title}</span>
                      <span className="home-next-meta">
                        {nextWorkout.dayOfWeek !== undefined && `${dayName(nextWorkout.dayOfWeek, language)} · `}
                        {exerciseCountLabel(nextWorkout.exercises.length, workoutText, language)}
                        {nextWorkout.inProgress && ` · ${workoutText.status.inProgress}`}
                        {!nextWorkout.inProgress && nextWorkout.status === 'missed' && ` · ${workoutText.status.missed}`}
                      </span>
                      <Button className="home-next-button" onClick={handleStartNext} loading={starter.isStarting}>
                        {activeLog ? fill(copy.resumeWorkout, { title: activeLog.workoutTitle }) : copy.startNextWorkout}
                      </Button>
                      {starter.error && <p className="home-next-error">{starter.error}</p>}
                    </>
                  ) : activeLog ? (
                    // An open workout from another week (left unfinished) still resumes from here.
                    <Button className="home-next-button" onClick={handleStartNext}>
                      {fill(copy.resumeWorkout, { title: activeLog.workoutTitle })}
                    </Button>
                  ) : (
                    <p className="home-next-empty">
                      {plan.workouts.length === 0 ? copy.noWorkoutsInPlan : copy.allDone}
                    </p>
                  )}
                </section>

                {plan.workouts.length > 0 && (
                  <section aria-labelledby="home-week-title">
                    <h2 className="home-section-title home-section-title-ruled" id="home-week-title">
                      {copy.thisWeek}
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

            {/* The free interval timer (logs nothing) — always at hand from Home. */}
            <Button variant="secondary" className="home-interval-timer" onClick={() => navigate(ROUTES.INTERVAL_TIMER)}>
              {copy.intervalTimer}
            </Button>

            {achievements && <AchievementStrip achievements={achievements.unlocked} titleId="home-achievements-title" />}
          </>
        )}
      </div>
      <StartConflictModal
        active={starter.conflict}
        isBusy={starter.isStarting}
        onClose={starter.closeConflict}
        onResume={starter.resumeActive}
        onDiscardAndStart={() => void starter.discardActiveAndStart()}
      />
    </AppShell>
  );
}
