import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { CoachTraineeDetail } from '@sistem/types';
import { addDaysToDate, sharedCopy, useCopy } from '@sistem/shared';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { useCoachData } from '../../../../services/coach/CoachDataContext';
import { AiDraftSheet } from '../../../aiDraft/components/AiDraftSheet/AiDraftSheet';
import { AiPlanCard } from '../../../aiDraft/components/AiPlanCard/AiPlanCard';
import { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import { useTrainingConfig } from '../../../trainingConfig/useTrainingConfig';
import { splitPlansByWeek } from '../../data/planWeeks';
import { useNewPlanPopover } from '../../hooks/useNewPlanPopover';
import type { TraineePlansLoad } from '../../hooks/useTraineePlans';
import { NewPlanPopover } from '../NewPlanPopover/NewPlanPopover';
import { NextWeekCard } from '../NextWeekCard/NextWeekCard';
import { PlansToolbar } from '../PlansToolbar/PlansToolbar';
import { PlanStartOptions } from '../PlanStartOptions/PlanStartOptions';
import { ThisWeekCard } from '../ThisWeekCard/ThisWeekCard';
import { WeekTimeline } from '../WeekTimeline/WeekTimeline';
import './TraineePlans.css';
import { traineesCopy } from '../../copy';

interface TraineePlansProps {
  trainee: CoachTraineeDetail;
  /** Her plans, loaded by the page. */
  plansLoad: TraineePlansLoad;
  /** The header's "build plan" was pressed: open the "new plan" popover, then report it handled. */
  wantsNewPlan: boolean;
  onNewPlanHandled: () => void;
  /** A plan was created — the trainee's status may have changed. */
  onPlansChanged: () => void;
}

/**
 * The Plans tab. Without plans: the AI draft as the main card, with "from scratch" beside it.
 * With plans: this week (large), next week beside it, then the weeks before. Every new plan
 * starts in the "new plan" popover; the AI draft's options live in its side sheet.
 */
export function TraineePlans({ trainee, plansLoad, wantsNewPlan, onNewPlanHandled, onPlansChanged }: TraineePlansProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const { plans, error, isLoading, reload } = plansLoad;
  const ai = useLatestAiDraft(trainee.id);
  const config = useTrainingConfig();
  const { weekOf } = useCoachData();
  const [isAiSheetOpen, setIsAiSheetOpen] = useState(false);
  const popover = useNewPlanPopover(trainee.id, ai.ready?.id, () => {
    reload();
    onPlansChanged();
  });
  const openNewPlan = popover.open;
  const currentPlan = weekOf(trainee.id)?.currentPlan ?? null;

  // "New plan" from the top line or the drawer — and "duplicate last week" from the plan builder —
  // land here with the popover already open.
  const linkState = useLocation().state as { newPlan?: boolean; duplicate?: boolean } | null;
  const cameForNewPlan = linkState?.newPlan === true;
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (!cameForNewPlan || openedFromLink.current) return;
    openedFromLink.current = true;
    void openNewPlan({ method: linkState?.duplicate ? 'duplicate' : 'scratch' });
    // Once, when the page is entered that way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameForNewPlan]);

  // The header's pink pill.
  useEffect(() => {
    if (!wantsNewPlan) return;
    onNewPlanHandled();
    void openNewPlan();
  }, [wantsNewPlan, onNewPlanHandled, openNewPlan]);

  const hasPlans = plans !== undefined && plans.length > 0;
  const byWeek = plans ? splitPlansByWeek(plans, trainee.currentWeekStart) : null;
  // This week's statuses belong to this week's PUBLISHED plan only.
  const progress = byWeek?.thisWeek && currentPlan?.id === byWeek.thisWeek.id ? currentPlan : null;

  return (
    <div className="trainee-plans">
      {/* The popover hangs from this bar; a trainee without plans has no pills in it. */}
      <div className="plans-bar">
        {hasPlans && <PlansToolbar onStart={(method) => void openNewPlan({ method })} />}
        <NewPlanPopover
          popover={popover}
          aiWorkoutCount={ai.ready?.output?.workouts.length}
          onOpenAiOptions={() => {
            popover.close();
            setIsAiSheetOpen(true);
          }}
        />
      </div>

      {isLoading && <p className="plans-message">{shared.common.loading}</p>}
      {error && (
        <p className="plans-message" role="alert">
          {error}{' '}
          <PillButton size="sm" onClick={reload}>
            {shared.common.retry}
          </PillButton>
        </p>
      )}

      {plans && !hasPlans && (
        <div className="plans-start-grid">
          <AiPlanCard
            ai={ai}
            disabled={popover.isCreating}
            onOpenInBuilder={() => void openNewPlan({ method: 'ai' })}
            onOpenOptions={() => setIsAiSheetOpen(true)}
          />
          <PlanStartOptions disabled={popover.isCreating} onFromScratch={() => void openNewPlan()} />
        </div>
      )}

      {hasPlans && byWeek && (
        <>
          <div className="plans-now">
            <ThisWeekCard traineeId={trainee.id} traineeName={trainee.name} plan={byWeek.thisWeek} progress={progress} onNewPlan={() => void openNewPlan()} />
            <NextWeekCard
              traineeId={trainee.id}
              traineeName={trainee.name}
              weekStartDate={addDaysToDate(trainee.currentWeekStart, 7)}
              plan={byWeek.nextWeek}
              // The server says how many days this week's plan has left; next week starts the day after.
              startsInDays={currentPlan ? currentPlan.daysLeft + 1 : undefined}
              onNewPlan={() => void openNewPlan()}
            />
          </div>
          <WeekTimeline traineeId={trainee.id} title={copy.laterWeeks} plans={byWeek.later} showStatus />
          <WeekTimeline traineeId={trainee.id} title={copy.pastWeeks} plans={byWeek.past} />
        </>
      )}

      <AiDraftSheet
        isOpen={isAiSheetOpen}
        onClose={() => setIsAiSheetOpen(false)}
        traineeId={trainee.id}
        ai={ai}
        config={config}
        linkedRecommendationId={undefined}
        canApply={!popover.isCreating}
        onUseFullPlan={(recommendation) => {
          setIsAiSheetOpen(false);
          void openNewPlan({ method: 'ai', aiStart: { loadAiDraftId: recommendation.id } });
        }}
        onUseSplitOnly={(option, recommendation) => {
          setIsAiSheetOpen(false);
          void openNewPlan({ method: 'ai', aiStart: { splitOnly: { splitId: option.splitId, daysPerWeek: option.daysPerWeek, recommendationId: recommendation.id } } });
        }}
      />
    </div>
  );
}
