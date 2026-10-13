import type { CoachPlan } from '@sistem/types';
import { fill, formatPlural, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { workoutColorClass } from '../../../planBuilder/data/workoutColors';
import { planName } from '../../data/planWeeks';
import { traineesCopy } from '../../copy';
import './NextWeekCard.css';

interface NextWeekCardProps {
  traineeId: string;
  traineeName: string;
  /** 'YYYY-MM-DD' Sunday of next week (her zone). */
  weekStartDate: string;
  plan: CoachPlan | undefined;
  /** Days until that week starts, when the server told us how many days this week has left. */
  startsInDays: number | undefined;
  /** No plan for next week: open the "new plan" popover. */
  onNewPlan: () => void;
}

/** Next week, beside this week: its plan and workouts — a draft says it is not live yet — or the way to make one. */
export function NextWeekCard({ traineeId, traineeName, weekStartDate, plan, startsInDays, onNewPlan }: NextWeekCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const when = [formatWeekSpan(weekStartDate, language), startsInDays !== undefined ? formatPlural(language, copy.startsIn, startsInDays) : undefined]
    .filter(Boolean)
    .join(' · ');

  if (!plan) {
    return (
      <section className="next-week">
        <p className="week-eyebrow">{shared.weekRelation.next}</p>
        <p className="next-week-sub">{when}</p>
        <p className="next-week-none">{copy.noPlanNextWeek}</p>
        <PillButton variant="primary" className="next-week-action" onClick={onNewPlan}>
          {copy.newPlan}
        </PillButton>
      </section>
    );
  }

  const isDraft = plan.status === 'draft';
  const name = planName(plan, language);
  return (
    <section className="next-week">
      <p className="week-eyebrow">{shared.weekRelation.next}</p>
      <h2 className="next-week-title">{[name, shared.coach.planStatus[plan.status]].filter(Boolean).join(' · ')}</h2>
      <p className="next-week-sub">{when}</p>
      <ul className="next-week-chips">
        {plan.workouts.map((workout, index) => (
          <li key={workout.id} className={`next-week-chip ${workoutColorClass(index)}`}>
            <span className="next-week-dot" aria-hidden="true" />
            <bdi>{workout.title}</bdi>
          </li>
        ))}
      </ul>
      {isDraft && <p className="week-note next-week-note">{fill(copy.notPublishedNote, { name: traineeName })}</p>}
      <PillButton variant={isDraft ? 'primary' : 'fill'} className="next-week-action" to={planPath(traineeId, plan.id)}>
        {isDraft ? copy.continueAndPublish : copy.openInBuilderShort}
      </PillButton>
    </section>
  );
}
