import type { CoachPlan, CoachWeekPlan } from '@sistem/types';
import { dateFormat, fill, formatWeekSpan, sharedCopy, splitLabel, useCopy, useLanguage, weekRelationLabel } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { Icon } from '../../../../components/common/Icon/Icon';
import { RoundButton } from '../../../../components/common/RoundButton/RoundButton';
import { Tag } from '../../../../components/common/Tag/Tag';
import { aiDraftCopy } from '../../../aiDraft/copy';
import { traineesCopy } from '../../copy';
import { WeekSquares } from '../WeekSquares/WeekSquares';
import './PlanWeekRow.css';

interface PlanWeekRowProps {
  traineeId: string;
  plan: CoachPlan;
  /** The trainee's current week ('YYYY-MM-DD' Sunday, her zone) — from the server. */
  currentWeekStart: string;
  /** This week's published plan with its workout statuses, when this row is that plan. */
  weekProgress: CoachWeekPlan | null;
}

/**
 * One week of the trainee's plans: the week's first day large, what the plan is (its split, or
 * its size) with its status, the dates, this week's workout squares, and the way into the builder.
 */
export function PlanWeekRow({ traineeId, plan, currentWeekStart, weekProgress }: PlanWeekRowProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const ai = useCopy(aiDraftCopy);
  const start = new Date(`${plan.weekStartDate}T00:00:00Z`);
  const exerciseCount = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
  const size = fill(copy.planSize, { workouts: plan.workouts.length, exercises: exerciseCount });
  const relation = weekRelationLabel(plan.weekStartDate, currentWeekStart, language);
  const span = formatWeekSpan(plan.weekStartDate, language);
  // A published plan of a week that is over: nothing more will happen in it.
  const hasEnded = plan.status === 'published' && plan.weekStartDate < currentWeekStart;

  return (
    <li className="week-row">
      <span className="week-row-date" aria-hidden="true">
        <span className="week-row-day">{start.getUTCDate()}</span>
        <span className="week-row-month">{dateFormat(language, { timeZone: 'UTC', month: 'short' }).format(start)}</span>
      </span>

      <div className="week-row-main">
        <p className="week-row-title">
          <span>{plan.splitId ? splitLabel(plan.splitId, language) : size}</span>
          {hasEnded ? <Tag>{copy.planEnded}</Tag> : <Tag tone={plan.status === 'published' ? 'accent' : 'neutral'}>{shared.coach.planStatus[plan.status]}</Tag>}
          {plan.locked && !hasEnded && <Tag tone="quiet">{shared.coach.startedByTrainee}</Tag>}
          {plan.aiRecommendationId && <Tag tone="quiet">{ai.training.fromAiBadge}</Tag>}
        </p>
        <p className="week-row-sub">
          {[relation, span, plan.splitId ? size : undefined].filter(Boolean).join(' · ')}
        </p>
      </div>

      <span className="week-row-squares">
        {weekProgress && (
          <WeekSquares workouts={weekProgress.workouts} label={fill(copy.weekSummary, { done: weekProgress.completed, planned: weekProgress.planned })} />
        )}
      </span>

      <RoundButton variant="outline" to={planPath(traineeId, plan.id)} label={fill(copy.openWeek, { week: span })}>
        <Icon name="arrowOut" size="sm" flip />
      </RoundButton>
    </li>
  );
}
