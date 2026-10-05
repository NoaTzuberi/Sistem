import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CoachTraineeDetail, PlanWeekOptions } from '@sistem/types';
import { createPlan, listPlanWeeks, listPlans } from '../../../../services/coach/coachService';
import { useLoad, formatWeekSpan, weekRelationLabel } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { WeekPicker } from '../WeekPicker/WeekPicker';
import type { WeekPickerMode } from '../WeekPicker/WeekPicker';
import './TraineePlans.css';

interface TraineePlansProps {
  trainee: CoachTraineeDetail;
  /** A plan was created — the trainee's status may have changed. */
  onPlansChanged: () => void;
}

export function TraineePlans({ trainee, onPlansChanged }: TraineePlansProps) {
  const navigate = useNavigate();
  const load = useCallback(() => listPlans(trainee.id), [trainee.id]);
  const { data: plans, error, isLoading, reload } = useLoad(load, "Couldn't load the plans.");
  // The week picker: which action opened it, and the weeks the server offers (fresh each time).
  const [picker, setPicker] = useState<{ mode: WeekPickerMode; options: PlanWeekOptions } | null>(null);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string>();

  async function openPicker(mode: WeekPickerMode) {
    setIsOpeningPicker(true);
    setCreateError(undefined);
    try {
      setPicker({ mode, options: await listPlanWeeks(trainee.id) });
    } catch {
      setCreateError("Couldn't load the weeks. Please try again.");
    } finally {
      setIsOpeningPicker(false);
    }
  }

  async function handleCreate(weekStartDate: string) {
    if (!picker) return;
    setIsCreating(true);
    setCreateError(undefined);
    try {
      const plan = await createPlan(trainee.id, { weekStartDate, duplicatePrevious: picker.mode === 'duplicate' });
      onPlansChanged();
      navigate(planPath(trainee.id, plan.id));
    } catch (createFailure) {
      setCreateError(createFailure instanceof Error ? createFailure.message : "Couldn't create the plan.");
      reload();
      setIsCreating(false);
      // The weeks may have changed (e.g. a plan made elsewhere): show the fresh state.
      void openPicker(picker.mode);
    }
  }

  return (
    <div className="trainee-plans">
      {!picker && (
        <div className="plans-create">
          <Button variant="primary" disabled={isOpeningPicker} onClick={() => void openPicker('new')}>
            New plan
          </Button>
          <Button disabled={isOpeningPicker || !plans || plans.length === 0} onClick={() => void openPicker('duplicate')}>
            Duplicate last week
          </Button>
        </div>
      )}
      {picker && (
        <WeekPicker
          key={picker.mode}
          traineeId={trainee.id}
          mode={picker.mode}
          options={picker.options}
          isCreating={isCreating}
          onConfirm={(week) => void handleCreate(week)}
          onCancel={() => setPicker(null)}
        />
      )}
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
            const relation = weekRelationLabel(plan.weekStartDate, trainee.currentWeekStart);
            return (
              <li key={plan.id} className="plans-item">
                <div className="plans-item-main">
                  <span className="plans-item-week">{formatWeekSpan(plan.weekStartDate)}</span>
                  <Badge tone={plan.status === 'published' ? 'accent' : 'neutral'}>
                    {plan.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                  {relation && <Badge>{relation}</Badge>}
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
