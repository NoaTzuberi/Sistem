import { useCallback, useState } from 'react';
import type { CoachPlan, CoachTraineeDetail, PlanIssue } from '@sistem/types';
import { PlanRequestError } from '@sistem/api-client';
import { addDaysToDate, formatWeekRange, useLoad } from '@sistem/shared';
import { IconInfoCircle } from '@tabler/icons-react';
import { createPlan, listPlans, publishPlan } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { describeIssue } from '../../data/planDisplay';
import { CoachMessage } from '../CoachMessage/CoachMessage';
import { ConfirmSheet } from '../ConfirmSheet/ConfirmSheet';
import { PlanCard } from '../PlanCard/PlanCard';
import './TraineePlan.css';

interface TraineePlanProps {
  trainee: CoachTraineeDetail;
  /** A plan was published — the trainee's status may have changed. */
  onPlansChanged: () => void;
}

/** The light action waiting for a "yes" in the confirm sheet. */
type PendingAction = { kind: 'publish'; plan: CoachPlan } | { kind: 'duplicate'; week: string };

interface ActionFailure {
  week: string;
  message: string;
  issues: PlanIssue[];
}

/**
 * This week's and next week's plan, read-only, with the two light actions of coach
 * mode (PRD §6): publish a ready draft, and duplicate last week and publish. Both
 * use the dashboard's plan calls; every plan rule stays on the server.
 */
export function TraineePlan({ trainee, onPlansChanged }: TraineePlanProps) {
  const load = useCallback(() => listPlans(trainee.id), [trainee.id]);
  const { data: plans, error, isLoading, reload } = useLoad(load, "Couldn't load the plans.");
  const [pending, setPending] = useState<PendingAction>();
  const [isWorking, setIsWorking] = useState(false);
  const [failure, setFailure] = useState<ActionFailure>();

  if (isLoading && !plans) return <CoachMessage>Loading…</CoachMessage>;
  if (!plans) return <CoachMessage onRetry={reload}>{error}</CoachMessage>;

  // Weeks are Sundays in the trainee's time zone; the server sends the current one.
  const weeks = [
    { label: 'This week', start: trainee.currentWeekStart },
    { label: 'Next week', start: addDaysToDate(trainee.currentWeekStart, 7) },
  ];
  const planFor = (week: string) => plans.find((plan) => plan.weekStartDate === week);
  // "Duplicate last week" fills the first of the two weeks that has no plan, from
  // the most recent earlier plan (the server picks it).
  const duplicateWeek = weeks.find((week) => !planFor(week.start))?.start;
  const canDuplicate = duplicateWeek !== undefined && plans.some((plan) => plan.weekStartDate < duplicateWeek);

  async function handleConfirm() {
    if (!pending) return;
    const week = pending.kind === 'publish' ? pending.plan.weekStartDate : pending.week;
    let copyWasSaved = false;

    setIsWorking(true);
    setFailure(undefined);
    try {
      let planId: string;
      if (pending.kind === 'duplicate') {
        const copy = await createPlan(trainee.id, { weekStartDate: week, duplicatePrevious: true });
        planId = copy.id;
        copyWasSaved = true;
      } else {
        planId = pending.plan.id;
      }
      await publishPlan(trainee.id, planId);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Couldn't publish the plan. Please try again.";
      setFailure({
        week,
        message: copyWasSaved ? `The copy was saved as a draft, but it was not published. ${message}` : message,
        issues: actionError instanceof PlanRequestError ? actionError.issues : [],
      });
    } finally {
      setIsWorking(false);
      setPending(undefined);
      reload();
      onPlansChanged();
    }
  }

  const pendingWeek = pending ? formatWeekRange(pending.kind === 'publish' ? pending.plan.weekStartDate : pending.week) : '';

  return (
    <div className="trainee-plan">
      {error && <CoachMessage onRetry={reload}>{error}</CoachMessage>}

      {weeks.map((week) => {
        const plan = planFor(week.start);
        return (
          <section key={week.start} className="trainee-plan-week">
            <h2 className="trainee-plan-week-title">
              {week.label} <span className="trainee-plan-week-dates">· {formatWeekRange(week.start)}</span>
            </h2>

            {plan ? (
              <PlanCard plan={plan}>
                {plan.status === 'draft' && (
                  <Button className="trainee-plan-action" onClick={() => setPending({ kind: 'publish', plan })}>
                    Publish plan
                  </Button>
                )}
              </PlanCard>
            ) : (
              <>
                <p className="trainee-plan-none">No plan for this week yet.</p>
                {canDuplicate && week.start === duplicateWeek && (
                  <Button
                    className="trainee-plan-action"
                    onClick={() => setPending({ kind: 'duplicate', week: week.start })}
                  >
                    Duplicate last week and publish
                  </Button>
                )}
              </>
            )}

            {failure?.week === week.start && (
              <div className="trainee-plan-failure" role="alert">
                <p className="trainee-plan-failure-message">{failure.message}</p>
                {failure.issues.length > 0 && (
                  <ul className="trainee-plan-issues">
                    {failure.issues.map((issue, index) => (
                      <li key={index}>{describeIssue(issue)}</li>
                    ))}
                  </ul>
                )}
                <p className="trainee-plan-failure-message">Fix it on the dashboard, then publish.</p>
              </div>
            )}
          </section>
        );
      })}

      <p className="trainee-plan-hint">
        <IconInfoCircle className="trainee-plan-hint-icon" size={20} aria-hidden="true" />
        Plans are built and edited on the dashboard, on a computer.
      </p>

      <ConfirmSheet
        isOpen={pending !== undefined}
        title={pending?.kind === 'duplicate' ? 'Duplicate and publish?' : 'Publish this plan?'}
        message={
          pending?.kind === 'duplicate'
            ? `${trainee.name}'s most recent plan will be copied to ${pendingWeek} and published. The trainee will be notified.`
            : `${trainee.name} will see the plan for ${pendingWeek}. The trainee will be notified.`
        }
        confirmLabel={pending?.kind === 'duplicate' ? 'Duplicate and publish' : 'Publish'}
        isWorking={isWorking}
        onConfirm={handleConfirm}
        onCancel={() => setPending(undefined)}
      />
    </div>
  );
}
