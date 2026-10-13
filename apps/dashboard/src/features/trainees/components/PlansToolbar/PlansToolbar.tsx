import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { aiDraftCopy } from '../../../aiDraft/copy';
import type { PlanStartMethod } from '../../hooks/useNewPlanPopover';
import { traineesCopy } from '../../copy';
import './PlansToolbar.css';

interface PlansToolbarProps {
  /** Opens the "new plan" popover with that start method preselected. */
  onStart: (method: PlanStartMethod) => void;
}

/** The three ways to start a plan, as pills. Each opens the "new plan" popover on its own method. */
export function PlansToolbar({ onStart }: PlansToolbarProps) {
  const copy = useCopy(traineesCopy);
  const ai = useCopy(aiDraftCopy);
  return (
    <div className="plans-toolbar">
      <button className="plans-pill plans-pill-primary" type="button" onClick={() => onStart('scratch')}>
        <Icon name="plus" size="sm" className="plans-pill-icon" />
        {copy.newPlan}
      </button>
      <button className="plans-pill" type="button" onClick={() => onStart('duplicate')}>
        <Icon name="copy" size="sm" className="plans-pill-icon" />
        {copy.duplicateLastWeek}
      </button>
      <button className="plans-pill plans-pill-ai" type="button" onClick={() => onStart('ai')}>
        <Icon name="spark" size="sm" className="plans-pill-icon" />
        {ai.training.title}
      </button>
    </div>
  );
}
