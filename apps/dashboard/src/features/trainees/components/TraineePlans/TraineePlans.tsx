import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { CoachTraineeDetail } from '@sistem/types';
import { sharedCopy, useCopy } from '@sistem/shared';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { useCoachData } from '../../../../services/coach/CoachDataContext';
import { AiDraftSheet } from '../../../aiDraft/components/AiDraftSheet/AiDraftSheet';
import { AiPlanCard } from '../../../aiDraft/components/AiPlanCard/AiPlanCard';
import { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import { aiDraftCopy } from '../../../aiDraft/copy';
import { useTrainingConfig } from '../../../trainingConfig/useTrainingConfig';
import { usePlanCreation } from '../../hooks/usePlanCreation';
import type { TraineePlansLoad } from '../../hooks/useTraineePlans';
import { PlanStartOptions } from '../PlanStartOptions/PlanStartOptions';
import { PlanWeekRow } from '../PlanWeekRow/PlanWeekRow';
import { WeekPicker } from '../WeekPicker/WeekPicker';
import './TraineePlans.css';
import { traineesCopy } from '../../copy';

interface TraineePlansProps {
  trainee: CoachTraineeDetail;
  /** Her plans, loaded by the page. */
  plansLoad: TraineePlansLoad;
  /** The header's "build plan" was pressed: open the week picker, then report it handled. */
  wantsNewPlan: boolean;
  onNewPlanHandled: () => void;
  /** A plan was created — the trainee's status may have changed. */
  onPlansChanged: () => void;
}

/**
 * The Plans tab. Without plans: the AI draft as the main card, with "from scratch" beside it.
 * With plans: one row per week. Either way a new plan starts with the week picker, and the AI
 * draft's options live in its side sheet.
 */
export function TraineePlans({ trainee, plansLoad, wantsNewPlan, onNewPlanHandled, onPlansChanged }: TraineePlansProps) {
  const shared = useCopy(sharedCopy);
  const aiText = useCopy(aiDraftCopy);
  const copy = useCopy(traineesCopy);
  const { plans, error, isLoading, reload } = plansLoad;
  const ai = useLatestAiDraft(trainee.id);
  const config = useTrainingConfig();
  const { weekOf } = useCoachData();
  const [isAiSheetOpen, setIsAiSheetOpen] = useState(false);
  const creation = usePlanCreation(trainee.id, () => {
    reload();
    onPlansChanged();
  });
  const { openPicker } = creation;
  const currentPlan = weekOf(trainee.id)?.currentPlan ?? null;

  // "New plan" from the top line or the drawer — and "duplicate last week" from the plan builder —
  // land here with the week picker already open.
  const linkState = useLocation().state as { newPlan?: boolean; duplicate?: boolean } | null;
  const cameForNewPlan = linkState?.newPlan === true;
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (!cameForNewPlan || openedFromLink.current) return;
    openedFromLink.current = true;
    void openPicker(linkState?.duplicate ? 'duplicate' : 'new');
    // Once, when the page is entered that way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameForNewPlan]);

  // The header's pink pill.
  useEffect(() => {
    if (!wantsNewPlan) return;
    onNewPlanHandled();
    void openPicker('new');
  }, [wantsNewPlan, onNewPlanHandled, openPicker]);

  const picker = creation.picker && (
    <WeekPicker
      key={creation.picker.mode}
      traineeId={trainee.id}
      mode={creation.picker.mode}
      options={creation.picker.options}
      isCreating={creation.isCreating}
      onConfirm={(week) => void creation.create(week)}
      onCancel={creation.closePicker}
    />
  );

  return (
    <div className="trainee-plans">
      {creation.error && (
        <p className="plans-error" role="alert">
          {creation.error}
        </p>
      )}
      {isLoading && <p className="plans-message">{shared.common.loading}</p>}
      {error && (
        <p className="plans-message" role="alert">
          {error}{' '}
          <PillButton size="sm" onClick={reload}>
            {shared.common.retry}
          </PillButton>
        </p>
      )}

      {plans && plans.length === 0 && (
        <>
          {picker}
          <div className="plans-start-grid">
            <AiPlanCard
              ai={ai}
              disabled={creation.isBusy}
              onOpenInBuilder={() => ai.ready && void openPicker('new', { loadAiDraftId: ai.ready.id })}
              onOpenOptions={() => setIsAiSheetOpen(true)}
            />
            <PlanStartOptions disabled={creation.isBusy} onFromScratch={() => void openPicker('new')} />
          </div>
        </>
      )}

      {plans && plans.length > 0 && (
        <>
          <div className="plans-actions">
            <PillButton disabled={creation.isBusy} onClick={() => void openPicker('new')}>
              {copy.newPlan}
            </PillButton>
            <PillButton disabled={creation.isBusy} onClick={() => void openPicker('duplicate')}>
              {copy.duplicateLastWeek}
            </PillButton>
            <PillButton onClick={() => setIsAiSheetOpen(true)}>{aiText.training.title}</PillButton>
          </div>
          {picker}
          <ul className="plans-weeks">
            {plans.map((plan) => (
              <PlanWeekRow
                key={plan.id}
                traineeId={trainee.id}
                plan={plan}
                currentWeekStart={trainee.currentWeekStart}
                weekProgress={currentPlan?.id === plan.id ? currentPlan : null}
              />
            ))}
          </ul>
        </>
      )}

      <AiDraftSheet
        isOpen={isAiSheetOpen}
        onClose={() => setIsAiSheetOpen(false)}
        traineeId={trainee.id}
        ai={ai}
        config={config}
        linkedRecommendationId={undefined}
        canApply={!creation.isBusy}
        onUseFullPlan={(recommendation) => {
          setIsAiSheetOpen(false);
          void openPicker('new', { loadAiDraftId: recommendation.id });
        }}
        onUseSplitOnly={(option, recommendation) => {
          setIsAiSheetOpen(false);
          void openPicker('new', { splitOnly: { splitId: option.splitId, daysPerWeek: option.daysPerWeek, recommendationId: recommendation.id } });
        }}
      />
    </div>
  );
}
