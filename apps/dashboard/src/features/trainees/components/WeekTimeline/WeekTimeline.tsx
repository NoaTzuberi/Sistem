import type { CoachPlan } from '@sistem/types';
import { fill, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { Icon } from '../../../../components/common/Icon/Icon';
import { RoundButton } from '../../../../components/common/RoundButton/RoundButton';
import { describePlanSize, planName } from '../../data/planWeeks';
import { traineesCopy } from '../../copy';
import './WeekTimeline.css';

interface WeekTimelineProps {
  traineeId: string;
  title: string;
  plans: CoachPlan[];
  /** Coming weeks say whether each plan is a draft or published; past weeks do not. */
  showStatus?: boolean;
}

/**
 * A quiet timeline of plans that are not this week's or next week's: one row per week — a dot,
 * its dates, what the plan is, and the way into the builder.
 */
export function WeekTimeline({ traineeId, title, plans, showStatus = false }: WeekTimelineProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  if (plans.length === 0) return null;

  return (
    <section className="week-timeline">
      <h2 className="week-timeline-title">{title}</h2>
      <ul className="week-timeline-list">
        {plans.map((plan) => {
          const span = formatWeekSpan(plan.weekStartDate, language);
          return (
            <li key={plan.id} className="week-timeline-row">
              <span className="week-timeline-dot" aria-hidden="true" />
              <span className="week-timeline-dates">{span}</span>
              <span className="week-timeline-name">
                {[planName(plan, language), describePlanSize(plan, language), showStatus ? shared.coach.planStatus[plan.status] : undefined].filter(Boolean).join(' · ')}
              </span>
              <RoundButton variant="outline" to={planPath(traineeId, plan.id)} label={fill(copy.openWeek, { week: span })}>
                <Icon name="arrowOut" size="sm" flip />
              </RoundButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
