import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CoachTraineeDetail } from '@sistem/types';
import { createPlan, listPlans } from '../../../../services/coach/coachService';
import { useLoad } from '../../../../hooks/useLoad';
import { planPath } from '../../../../app/config/routes';
import { addDaysToDate, formatDateOnly } from '../../../../utils/format';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import './TraineePlans.css';

// The current week plus the three after it.
const WEEKS_OFFERED = 4;

interface TraineePlansProps {
  trainee: CoachTraineeDetail;
  /** A plan was created — the trainee's status may have changed. */
  onPlansChanged: () => void;
}

export function TraineePlans({ trainee, onPlansChanged }: TraineePlansProps) {
  const navigate = useNavigate();
  const load = useCallback(() => listPlans(trainee.id), [trainee.id]);
  const { data: plans, error, isLoading, reload } = useLoad(load, "Couldn't load the plans.");
  const [chosenWeek, setChosenWeek] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string>();

  const takenWeeks = new Set(plans?.map((plan) => plan.weekStartDate));
  // Weeks are Sundays in the trainee's time zone; the server sends the current one.
  const weeks = Array.from({ length: WEEKS_OFFERED }, (_, index) => addDaysToDate(trainee.currentWeekStart, index * 7));
  // Until she picks one, the first week that still has no plan.
  const week = chosenWeek && !takenWeeks.has(chosenWeek) ? chosenWeek : (weeks.find((option) => !takenWeeks.has(option)) ?? '');

  const canCreate = plans !== undefined && week !== '' && !isCreating;
  const hasEarlierPlan = plans?.some((plan) => plan.weekStartDate < week) ?? false;

  async function handleCreate(duplicatePrevious: boolean) {
    setIsCreating(true);
    setCreateError(undefined);
    try {
      const plan = await createPlan(trainee.id, { weekStartDate: week, duplicatePrevious });
      onPlansChanged();
      navigate(planPath(trainee.id, plan.id));
    } catch (createFailure) {
      setCreateError(createFailure instanceof Error ? createFailure.message : "Couldn't create the plan.");
      reload();
      setIsCreating(false);
    }
  }

  return (
    <div className="trainee-plans">
      <div className="plans-create">
        <label className="plans-week">
          <span className="plans-week-label">Week</span>
          <select className="plans-week-select" value={week} onChange={(event) => setChosenWeek(event.target.value)}>
            {week === '' && <option value="">No free week</option>}
            {weeks.map((option) => (
              <option key={option} value={option} disabled={takenWeeks.has(option)}>
                {formatDateOnly(option)}
                {takenWeeks.has(option) ? ' — has a plan' : ''}
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" disabled={!canCreate} onClick={() => handleCreate(false)}>
          New plan
        </Button>
        <Button disabled={!canCreate || !hasEarlierPlan} onClick={() => handleCreate(true)}>
          Duplicate last week
        </Button>
      </div>
      {createError && (
        <p className="plans-error" role="alert">
          {createError}
        </p>
      )}

      {isLoading && !plans && <p className="plans-message">Loading…</p>}
      {error && (
        <p className="plans-message" role="alert">
          {error} <Button size="sm" onClick={reload}>Try again</Button>
        </p>
      )}
      {plans && plans.length === 0 && <p className="plans-message">No plans yet.</p>}

      {plans && plans.length > 0 && (
        <ul className="plans-list">
          {plans.map((plan) => {
            const exerciseCount = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
            return (
              <li key={plan.id} className="plans-item">
                <div className="plans-item-main">
                  <span className="plans-item-week">Week of {formatDateOnly(plan.weekStartDate)}</span>
                  <Badge tone={plan.status === 'published' ? 'accent' : 'neutral'}>
                    {plan.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                  {plan.weekStartDate === trainee.currentWeekStart && <Badge>This week</Badge>}
                  {plan.locked && <Badge>Started by trainee</Badge>}
                </div>
                <span className="plans-item-size">
                  {plan.workouts.length} workouts · {exerciseCount} exercises
                </span>
                <Link className="plans-item-open" to={planPath(trainee.id, plan.id)}>
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
