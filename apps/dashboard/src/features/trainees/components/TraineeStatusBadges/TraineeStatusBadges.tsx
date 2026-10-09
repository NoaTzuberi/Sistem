import type { CoachTraineeSummary } from '@sistem/types';
import { Badge } from '../../../../components/common/Badge/Badge';
import { formatTimeLeft, sharedCopy, TRAINEE_STATUS_TONES, useCopy, useLanguage } from '@sistem/shared';
import './TraineeStatusBadges.css';

interface TraineeStatusBadgesProps {
  trainee: CoachTraineeSummary;
}

export function TraineeStatusBadges({ trainee }: TraineeStatusBadgesProps) {
  const shared = useCopy(sharedCopy);
  return (
    <span className="trainee-status-badges">
      <Badge tone={TRAINEE_STATUS_TONES[trainee.status]}>{shared.traineeStatus.labels[trainee.status]}</Badge>
      {trainee.needsNextWeekPlan && <Badge tone="solid">{shared.traineeStatus.needsNextWeek}</Badge>}
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
  const language = useLanguage();
  if (!planDueAt) return <span className="plan-window-none">—</span>;
  const { text, isOverdue } = formatTimeLeft(planDueAt, nowMs, language);
  return <span className={isOverdue ? 'plan-window plan-window-overdue' : 'plan-window'}>{text}</span>;
}
