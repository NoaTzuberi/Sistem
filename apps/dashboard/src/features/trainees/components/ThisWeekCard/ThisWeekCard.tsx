import type { CoachPlan, CoachWeekPlan, WorkoutStatus } from '@sistem/types';
import { dayName, fill, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { Tag } from '../../../../components/common/Tag/Tag';
import { workoutColorClass } from '../../../planBuilder/data/workoutColors';
import { describePlanSize, planName } from '../../data/planWeeks';
import { traineesCopy } from '../../copy';
import { ProgressRing } from '../ProgressRing/ProgressRing';
import './ThisWeekCard.css';

interface ThisWeekCardProps {
  traineeId: string;
  traineeName: string;
  /** This week's plan (draft or published); undefined when the week has none. */
  plan: CoachPlan | undefined;
  /** The published plan's workout statuses and counts, decided by the server; null for a draft. */
  progress: CoachWeekPlan | null;
  /** No plan this week: open the "new plan" popover. */
  onNewPlan: () => void;
}

/**
 * The main card of the Plans tab: this week. What the plan is, how much of it is done (the
 * ring), and each workout with its identity color and its status — then the way into the builder.
 */
export function ThisWeekCard({ traineeId, traineeName, plan, progress, onNewPlan }: ThisWeekCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const statusWords: Record<WorkoutStatus, string> = { done: copy.workoutDone, upcoming: copy.workoutPlanned, missed: copy.workoutMissed };

  if (!plan) {
    return (
      <section className="this-week this-week-empty">
        <p className="week-eyebrow">{shared.weekRelation.this}</p>
        <p className="this-week-none">{copy.noPlanThisWeek}</p>
        <PillButton variant="primary" onClick={onNewPlan}>
          {copy.newPlan}
        </PillButton>
      </section>
    );
  }

  const span = formatWeekSpan(plan.weekStartDate, language);
  const name = planName(plan, language);
  const isDraft = plan.status === 'draft';

  return (
    <section className="this-week">
      <div className="this-week-top">
        <span className="week-eyebrow">{shared.weekRelation.this}</span>
        <Tag tone={isDraft ? 'neutral' : 'accent'}>{shared.coach.planStatus[plan.status]}</Tag>
        {plan.locked && <Tag tone="quiet">{shared.coach.startedByTrainee}</Tag>}
      </div>
      {/* A plan has no title of its own: its split when it follows one, else its dates. */}
      <h2 className="this-week-title">{name ?? span}</h2>
      <p className="this-week-sub">{[name ? span : undefined, describePlanSize(plan, language)].filter(Boolean).join(' · ')}</p>

      <div className="this-week-body">
        {progress && progress.planned > 0 && (
          <ProgressRing fraction={progress.completed / progress.planned} label={fill(copy.weekSummary, { done: progress.completed, planned: progress.planned })}>
            <span className="this-week-percent" dir="ltr">
              {Math.round((progress.completed / progress.planned) * 100)}%
            </span>
            <span className="this-week-count">{fill(copy.weekProgress, { done: progress.completed, planned: progress.planned })}</span>
          </ProgressRing>
        )}
        <ul className="this-week-workouts">
          {plan.workouts.map((workout, index) => {
            const status = progress?.workouts.find((entry) => entry.id === workout.id)?.status;
            const day = workout.dayOfWeek !== undefined ? dayName(workout.dayOfWeek, language) : undefined;
            const word = status ? statusWords[status] : undefined;
            return (
              <li key={workout.id} className={`this-week-workout ${workoutColorClass(index)}`}>
                <span className="this-week-dot" aria-hidden="true" />
                <bdi className="this-week-workout-name">{workout.title}</bdi>
                <span className={status === 'done' ? 'this-week-status this-week-status-done' : 'this-week-status'}>
                  {word && day ? fill(copy.statusOnDay, { status: word, day }) : (word ?? day)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {isDraft && <p className="week-note">{fill(copy.notPublishedNote, { name: traineeName })}</p>}
      <div className="this-week-actions">
        <PillButton variant="primary" to={planPath(traineeId, plan.id)}>
          {isDraft ? copy.continueAndPublish : copy.openInBuilderShort}
        </PillButton>
      </div>
    </section>
  );
}
