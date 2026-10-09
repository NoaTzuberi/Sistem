import { useCopy } from '@sistem/shared';
import { planBuilderCopy } from '../../copy';
import type { SaveStatus } from '../../hooks/usePlanEditor';
import './SaveIndicator.css';


interface SaveIndicatorProps {
  status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  const copy = useCopy(planBuilderCopy);
  return (
    <span className={`save-indicator save-indicator-${status}`} role="status">
      {copy.saveStatus[status]}
    </span>
  );
}
