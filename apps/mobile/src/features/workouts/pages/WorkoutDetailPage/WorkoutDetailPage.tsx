import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DAY_NAMES, formatWeekRange, useLoad } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Badge } from '../../../../components/common/Badge/Badge';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { getPlan } from '../../../../services/plans/plansService';
import { workoutLogPath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { StartConflictModal } from '../../components/StartConflictModal/StartConflictModal';
import { useStartWorkout } from '../../hooks/useStartWorkout';
import { BackButton } from '../../components/BackButton/BackButton';
import { PlanExerciseList } from '../../components/PlanExerciseList/PlanExerciseList';
import { WORKOUTS_COPY, exerciseCountLabel, workoutStatusBadge } from '../../data/workoutCopy';
import './WorkoutDetailPage.css';

// One planned workout (PRD §5.4): exercises, the server's resolved sets and the coach's
// notes, with Start / Resume for this week's workouts (Phase 8).
export function WorkoutDetailPage() {
  const { planId = '', workoutId = '' } = useParams();
  const load = useCallback(() => getPlan(planId), [planId]);
  const { data: plan, error, isLoading, reload } = useLoad(load, WORKOUTS_COPY.workoutLoadError);
  const workout = plan?.workouts.find((item) => item.id === workoutId);
  const badge = workout && workoutStatusBadge(workout);
  const starter = useStartWorkout();

  return (
    <AppShell>
      <div className="workout-detail">
        <header className="workout-detail-header">
          <BackButton />
          {plan && workout && badge && (
            <div className="workout-detail-heading">
              <h1 className="workout-detail-title">{workout.title}</h1>
              <span className="workout-detail-meta">
                {workout.dayOfWeek !== undefined && `${DAY_NAMES[workout.dayOfWeek]} · `}
                {formatWeekRange(plan.weekStartDate)} · {exerciseCountLabel(workout.exercises.length)}
              </span>
              <Badge variant={badge.variant} className="workout-detail-status">
                {badge.label}
              </Badge>
            </div>
          )}
        </header>

        {isLoading && !plan && <StateMessage>{WORKOUTS_COPY.loading}</StateMessage>}
        {error && !plan && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {plan && !workout && <StateMessage>{WORKOUTS_COPY.workoutNotFound}</StateMessage>}

        {plan && workout && (
          <>
            {workout.notes && <p className="workout-detail-notes">{workout.notes}</p>}
            <PlanExerciseList exercises={workout.exercises} />
            {workout.logId ? (
              <Link className="workout-detail-log-link" to={workoutLogPath(workout.logId)}>
                {WORKOUTS_COPY.viewLog}
              </Link>
            ) : plan.period === 'current' ? (
              <>
                <Button onClick={() => void starter.start(plan.id, workout.id)} loading={starter.isStarting}>
                  {workout.inProgress ? WORKOUTS_COPY.resumeWorkout : WORKOUTS_COPY.startWorkout}
                </Button>
                {starter.error && <p className="workout-detail-error">{starter.error}</p>}
              </>
            ) : (
              plan.period === 'upcoming' && <p className="workout-detail-hint">{WORKOUTS_COPY.notStartableYet}</p>
            )}
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
