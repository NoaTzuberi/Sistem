import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { aiDraftCopy } from '../../../aiDraft/copy';
import { traineesCopy } from '../../../trainees/copy';
import { planBuilderCopy } from '../../copy';
import './StartCards.css';

interface StartCardsProps {
  onDuplicateWeek: () => void;
  onAiDraft: () => void;
  onFromScratch: () => void;
}

/** An empty week: three ways to start, each running the flow that already exists. */
export function StartCards({ onDuplicateWeek, onAiDraft, onFromScratch }: StartCardsProps) {
  const copy = useCopy(planBuilderCopy);
  const trainee = useCopy(traineesCopy);
  const ai = useCopy(aiDraftCopy);

  return (
    <div className="start-cards">
      <button className="start-card" type="button" onClick={onDuplicateWeek}>
        <span className="start-card-icon">
          <Icon name="copy" />
        </span>
        <span className="start-card-title">{trainee.duplicateLastWeek}</span>
        <span className="start-card-hint">{copy.startDuplicateHint}</span>
      </button>
      <button className="start-card start-card-ai" type="button" onClick={onAiDraft}>
        <span className="start-card-icon">
          <Icon name="spark" />
        </span>
        <span className="start-card-title">{ai.training.title}</span>
        <span className="start-card-hint">{copy.startAiHint}</span>
      </button>
      <button className="start-card" type="button" onClick={onFromScratch}>
        <span className="start-card-icon">
          <Icon name="plus" />
        </span>
        <span className="start-card-title">{copy.startScratch}</span>
        <span className="start-card-hint">{copy.startScratchHint}</span>
      </button>
    </div>
  );
}
