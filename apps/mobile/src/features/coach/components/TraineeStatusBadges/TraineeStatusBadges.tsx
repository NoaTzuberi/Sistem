import type { CoachTraineeSummary } from '@sistem/types';
import { formatTimeLeft, NEEDS_NEXT_WEEK_LABEL, TRAINEE_STATUS_LABELS, TRAINEE_STATUS_TONES } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import './TraineeStatusBadges.css';

interface TraineeStatusBadgesProps {
  trainee: CoachTraineeSummary;
}

export function TraineeStatusBadges({ trainee }: TraineeStatusBadgesProps) {
  return (
    <span className="trainee-status-badges">
      {/* The shared tones are also Badge variants here. */}
      <Badge variant={TRAINEE_STATUS_TONES[trainee.status]}>{TRAINEE_STATUS_LABELS[trainee.status]}</Badge>
      {trainee.needsNextWeekPlan && <Badge variant="solid">{NEEDS_NEXT_WEEK_LABEL}</Badge>}
    </span>
  );
}

interface PlanWindowProps {
  /** End of the 48h window. */
  planDueAt: string;
  /** "Now" on the server's clock (useServerNow). */
  nowMs: number;
}

/** Time left on the 48h window for a trainee waiting for her first plan. */
export function PlanWindow({ planDueAt, nowMs }: PlanWindowProps) {
  const { text, isOverdue } = formatTimeLeft(planDueAt, nowMs);
  return (
    <span className={isOverdue ? 'plan-window plan-window-overdue' : 'plan-window'}>
      {isOverdue ? text : `${text} on the 48h window`}
    </span>
  );
}
