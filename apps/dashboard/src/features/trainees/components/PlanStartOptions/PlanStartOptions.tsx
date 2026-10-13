import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { traineesCopy } from '../../copy';
import './PlanStartOptions.css';

interface PlanStartOptionsProps {
  /** A week is being picked / a plan created. */
  disabled: boolean;
  onFromScratch: () => void;
}

/**
 * Beside the AI draft, for a trainee without plans: start from scratch — and "duplicate last
 * week", shown but not available yet, with the reason.
 */
export function PlanStartOptions({ disabled, onFromScratch }: PlanStartOptionsProps) {
  const copy = useCopy(traineesCopy);
  return (
    <div className="plan-start">
      <button className="plan-start-card" type="button" disabled={disabled} onClick={onFromScratch}>
        <span className="plan-start-icon">
          <Icon name="plus" />
        </span>
        <span className="plan-start-text">
          <span className="plan-start-title">{copy.fromScratch}</span>
          <span className="plan-start-hint">{copy.fromScratchHint}</span>
        </span>
      </button>
      {/* She has no plan to copy from yet. aria-disabled keeps the reason reachable by keyboard. */}
      <button className="plan-start-card plan-start-card-off" type="button" aria-disabled="true">
        <span className="plan-start-icon">
          <Icon name="copy" />
        </span>
        <span className="plan-start-text">
          <span className="plan-start-title">{copy.duplicateLastWeek}</span>
          <span className="plan-start-hint">{copy.duplicateAfterFirst}</span>
        </span>
      </button>
      <p className="plan-start-note">{copy.noPlansNote}</p>
    </div>
  );
}
