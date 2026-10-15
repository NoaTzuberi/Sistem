import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { aiDraftCopy } from '../../../aiDraft/copy';
import type { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import { nutritionCopy } from '../../copy';
import './AiDraftCompact.css';

interface AiDraftCompactProps {
  ai: ReturnType<typeof useLatestAiDraft<'nutrition_plan'>>;
  /** A ready draft whose banner was hidden: one press shows it again. */
  hiddenDraft: boolean;
  onShow: () => void;
}

/** The sidebar's small AI card when no banner is shown: make a draft (or a new one), its progress, or show the hidden one again. */
export function AiDraftCompact({ ai, hiddenDraft, onShow }: AiDraftCompactProps) {
  const copy = useCopy(nutritionCopy);
  const aiCopy = useCopy(aiDraftCopy);
  const { latest, running, unavailableReason } = ai;
  const canGenerate = !unavailableReason && !running && !ai.isStarting;

  return (
    <section className="nb-ai-compact" aria-live="polite" aria-labelledby="nb-ai-compact-title">
      <span className="nb-ai-compact-icon" aria-hidden="true">
        <Icon name="spark" size="sm" />
      </span>
      <div className="nb-ai-compact-text">
        <h3 className="nb-ai-compact-title" id="nb-ai-compact-title">
          {aiCopy.nutrition.title}
        </h3>
        {running && <p className="nb-ai-compact-line">{aiCopy.nutrition.generating}</p>}
        {unavailableReason && <p className="nb-ai-compact-line">{unavailableReason}</p>}
        {latest?.status === 'failed' && latest.error && (
          <p className="nb-ai-compact-line nb-ai-compact-error">
            {aiCopy.training.failedPrefix} {latest.error.message}
          </p>
        )}
        {ai.startError && <p className="nb-ai-compact-line nb-ai-compact-error">{ai.startError}</p>}
      </div>
      <div className="nb-ai-compact-actions">
        {hiddenDraft && (
          <button className="nb-text-button" type="button" onClick={onShow}>
            {copy.builder.aiReady}
          </button>
        )}
        {!unavailableReason && !running && (
          <button className="nb-pill-button nb-ai-compact-generate" type="button" disabled={!canGenerate} onClick={() => void ai.generate()}>
            {!latest ? aiCopy.training.generate : latest.status === 'failed' ? aiCopy.training.tryAgain : aiCopy.training.regenerate}
          </button>
        )}
      </div>
    </section>
  );
}
