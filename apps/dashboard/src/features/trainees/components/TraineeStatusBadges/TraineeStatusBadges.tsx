import type { CoachTraineeSummary } from '@sistem/types';
import { Badge } from '../../../../components/common/Badge/Badge';
import { formatTimeLeft, NEEDS_NEXT_WEEK_LABEL, TRAINEE_STATUS_LABELS, TRAINEE_STATUS_TONES } from '@sistem/shared';
import './TraineeStatusBadges.css';

interface TraineeStatusBadgesProps {
  trainee: CoachTraineeSummary;
}

export function TraineeStatusBadges({ trainee }: TraineeStatusBadgesProps) {
  return (
    <span className="trainee-status-badges">
      <Badge tone={TRAINEE_STATUS_TONES[trainee.status]}>{TRAINEE_STATUS_LABELS[trainee.status]}</Badge>
      {trainee.needsNextWeekPlan && <Badge tone="solid">{NEEDS_NEXT_WEEK_LABEL}</Badge>}
    </span>
  );
}

interface PlanWindowProps {
  /** End of the 48h window, or null when the trainee is not waiting. */
  planDueAt: string | null;
  /** "Now" on the server's clock (useServerNow). */
  nowMs: number;
}

/** Time left on the 48h window for a trainee waiting for her first plan. */
export function PlanWindow({ planDueAt, nowMs }: PlanWindowProps) {
  if (!planDueAt) return <span className="plan-window-none">—</span>;
  const { text, isOverdue } = formatTimeLeft(planDueAt, nowMs);
  return <span className={isOverdue ? 'plan-window plan-window-overdue' : 'plan-window'}>{text}</span>;
}
