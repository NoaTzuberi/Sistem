import type { PlanStatus } from '@sistem/types';
import { sharedCopy, useCopy } from '@sistem/shared';
import { planBuilderCopy } from '../../copy';
import type { SaveStatus } from '../../hooks/usePlanEditor';
import './StatusPill.css';

interface StatusPillProps {
  planStatus: PlanStatus;
  saveStatus: SaveStatus;
}

/** "Draft · Saved": the plan's status and where its last change is. Published = Cherry Rose (no green). */
export function StatusPill({ planStatus, saveStatus }: StatusPillProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const classNames = ['status-pill', `status-pill-${planStatus}`, saveStatus === 'error' && 'status-pill-error'].filter(Boolean).join(' ');
  return (
    <span className={classNames} role="status">
      <span className="status-pill-dot" aria-hidden="true" />
      {shared.coach.planStatus[planStatus]} · {copy.saveStatus[saveStatus]}
    </span>
  );
}
