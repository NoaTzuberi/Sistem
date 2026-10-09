import type { CoachTraineeSummary } from '@sistem/types';
import { fill, formatTimeLeft, sharedCopy, TRAINEE_STATUS_TONES, useCopy, useLanguage } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import './TraineeStatusBadges.css';

interface TraineeStatusBadgesProps {
  trainee: CoachTraineeSummary;
}

export function TraineeStatusBadges({ trainee }: TraineeStatusBadgesProps) {
  const shared = useCopy(sharedCopy);
  return (
    <span className="trainee-status-badges">
      {/* The shared tones are also Badge variants here. */}
      <Badge variant={TRAINEE_STATUS_TONES[trainee.status]}>{shared.traineeStatus.labels[trainee.status]}</Badge>
      {trainee.needsNextWeekPlan && <Badge variant="solid">{shared.traineeStatus.needsNextWeek}</Badge>}
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
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const { text, isOverdue } = formatTimeLeft(planDueAt, nowMs, language);
  return (
    <span className={isOverdue ? 'plan-window plan-window-overdue' : 'plan-window'}>
      {isOverdue ? text : fill(shared.coach.windowLeft, { time: text })}
    </span>
  );
}
