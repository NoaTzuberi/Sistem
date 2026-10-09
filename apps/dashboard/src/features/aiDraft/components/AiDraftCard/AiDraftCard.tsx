import { fill, formatDateTime, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { aiDraftCopy } from '../../copy';
import type { useLatestAiDraft } from '../../hooks/useLatestAiDraft';
import './AiDraftCard.css';

interface AiDraftCardProps {
  ai: ReturnType<typeof useLatestAiDraft<'training_plan'>>;
  /** Opens the week picker; the new plan starts from the ready draft. */
  onUseInNewPlan: () => void;
  disabled?: boolean;
}

/** Trainee → Plans: the newest AI draft's status, with Generate / Regenerate. */
export function AiDraftCard({ ai, onUseInNewPlan, disabled = false }: AiDraftCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(aiDraftCopy);
  const { latest, ready, running, unavailableReason } = ai;
  const canGenerate = !unavailableReason && !running && !ai.isStarting && !disabled;

  return (
    <section className="ai-draft-card" aria-live="polite">
      <header className="ai-draft-header">
        <h2 className="ai-draft-title">{copy.training.title}</h2>
        {latest && <Badge tone={latest.status === 'failed' ? 'alert' : latest.status === 'ready' ? 'accent' : 'neutral'}>{copy.status[latest.status]}</Badge>}
      </header>

      {ai.isLoading && <p className="ai-draft-muted">{shared.common.loading}</p>}
      {ai.error && <p className="ai-draft-error">{ai.error}</p>}
      {unavailableReason && <p className="ai-draft-muted">{unavailableReason}</p>}

      {!ai.isLoading && !latest && !unavailableReason && <p className="ai-draft-muted">{copy.training.none}</p>}
      {running && <p className="ai-draft-muted">{copy.training.generating}</p>}
      {latest?.status === 'failed' && latest.error && (
        <p className="ai-draft-error">
          {copy.training.failedPrefix} {latest.error.message}
        </p>
      )}

      {ready?.output && (
        <>
          <p className="ai-draft-summary" dir="auto">
            {ready.output.summary}
          </p>
          <p className="ai-draft-muted">
            {fill(copy.training.workoutCount, { count: ready.output.workouts.length })} · {formatDateTime(ready.completedAt ?? ready.createdAt, language)}
            {ready.model ? ` · ${ready.model}` : ''}
          </p>
          <p className="ai-draft-note">{copy.training.reviewNote}</p>
        </>
      )}

      {ai.startError && <p className="ai-draft-error">{ai.startError}</p>}

      <div className="ai-draft-actions">
        {ready && (
          <Button variant="primary" disabled={disabled} onClick={onUseInNewPlan}>
            {copy.training.useInNewPlan}
          </Button>
        )}
        {!unavailableReason && !running && (
          <Button disabled={!canGenerate} onClick={() => void ai.generate()}>
            {!latest ? copy.training.generate : latest.status === 'failed' ? copy.training.tryAgain : copy.training.regenerate}
          </Button>
        )}
      </div>
    </section>
  );
}
