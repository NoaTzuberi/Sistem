import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CoachTraineeDetail, PlanWeekOptions } from '@sistem/types';
import { createPlan, listPlanWeeks, listPlans } from '../../../../services/coach/coachService';
import { fill, formatWeekSpan, sharedCopy, useCopy, useLanguage, useLoad, weekRelationLabel } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { WeekPicker } from '../WeekPicker/WeekPicker';
import type { WeekPickerMode } from '../WeekPicker/WeekPicker';
import { AiDraftCard } from '../../../aiDraft/components/AiDraftCard/AiDraftCard';
import { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import { aiDraftCopy } from '../../../aiDraft/copy';
import './TraineePlans.css';
import { traineesCopy } from '../../copy';

interface TraineePlansProps {
  trainee: CoachTraineeDetail;
  /** A plan was created — the trainee's status may have changed. */
  onPlansChanged: () => void;
}

export function TraineePlans({ trainee, onPlansChanged }: TraineePlansProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const aiText = useCopy(aiDraftCopy);
  const copy = useCopy(traineesCopy);
  const navigate = useNavigate();
  const load = useCallback(() => listPlans(trainee.id), [trainee.id]);
  const { data: plans, error, isLoading, reload } = useLoad(load, copy.plansLoadError);
  const ai = useLatestAiDraft(trainee.id);
  // The week picker: which action opened it, the weeks the server offers (fresh each time),
  // and the AI draft the new plan starts from ("Use in a new plan").
  const [picker, setPicker] = useState<{ mode: WeekPickerMode; options: PlanWeekOptions; aiDraftId?: string } | null>(null);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string>();

  async function openPicker(mode: WeekPickerMode, aiDraftId?: string) {
    setIsOpeningPicker(true);
    setCreateError(undefined);
    try {
      setPicker({ mode, options: await listPlanWeeks(trainee.id), aiDraftId });
    } catch {
      setCreateError(copy.weeksLoadError);
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
      navigate(planPath(trainee.id, plan.id), picker.aiDraftId ? { state: { loadAiDraftId: picker.aiDraftId } } : undefined);
    } catch (createFailure) {
      setCreateError(createFailure instanceof Error ? createFailure.message : copy.createError);
      reload();
      setIsCreating(false);
      // The weeks may have changed (e.g. a plan made elsewhere): show the fresh state.
      void openPicker(picker.mode, picker.aiDraftId);
    }
  }

  return (
    <div className="trainee-plans">
      <AiDraftCard
        ai={ai}
        disabled={isOpeningPicker || picker !== null}
        onUseInNewPlan={() => ai.ready && void openPicker('new', ai.ready.id)}
      />

      {!picker && (
        <div className="plans-create">
          <Button variant="primary" disabled={isOpeningPicker} onClick={() => void openPicker('new')}>
            {copy.newPlan}
          </Button>
          <Button disabled={isOpeningPicker || !plans || plans.length === 0} onClick={() => void openPicker('duplicate')}>
            {copy.duplicateLastWeek}
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

      {isLoading && !plans && <p className="plans-message">{shared.common.loading}</p>}
      {error && (
        <p className="plans-message" role="alert">
          {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
        </p>
      )}
      {plans && plans.length === 0 && <p className="plans-message">{copy.noPlans}</p>}

      {plans && plans.length > 0 && (
        <ul className="plans-list">
          {plans.map((plan) => {
            const exerciseCount = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
            const relation = weekRelationLabel(plan.weekStartDate, trainee.currentWeekStart, language);
            return (
              <li key={plan.id} className="plans-item">
                <div className="plans-item-main">
                  <span className="plans-item-week">{formatWeekSpan(plan.weekStartDate, language)}</span>
                  <Badge tone={plan.status === 'published' ? 'accent' : 'neutral'}>
                    {shared.coach.planStatus[plan.status]}
                  </Badge>
                  {relation && <Badge>{relation}</Badge>}
                  {plan.locked && <Badge>{shared.coach.startedByTrainee}</Badge>}
                  {plan.aiRecommendationId && <Badge>{aiText.training.fromAiBadge}</Badge>}
                </div>
                <span className="plans-item-size">
                  {fill(copy.planSize, { workouts: plan.workouts.length, exercises: exerciseCount })}
                </span>
                <Link className="plans-item-open" to={planPath(trainee.id, plan.id)}>
                  {copy.open}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
