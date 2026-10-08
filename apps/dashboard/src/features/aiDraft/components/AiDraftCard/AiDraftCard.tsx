import { formatDateTime } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { AI_DRAFT_COPY, AI_STATUS_LABELS } from '../../data/aiDraftCopy';
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
  const { latest, ready, running, unavailableReason } = ai;
  const canGenerate = !unavailableReason && !running && !ai.isStarting && !disabled;

  return (
    <section className="ai-draft-card" aria-live="polite">
      <header className="ai-draft-header">
        <h2 className="ai-draft-title">{AI_DRAFT_COPY.title}</h2>
        {latest && <Badge tone={latest.status === 'failed' ? 'alert' : latest.status === 'ready' ? 'accent' : 'neutral'}>{AI_STATUS_LABELS[latest.status]}</Badge>}
      </header>

      {ai.isLoading && <p className="ai-draft-muted">Loading…</p>}
      {ai.error && <p className="ai-draft-error">{ai.error}</p>}
      {unavailableReason && <p className="ai-draft-muted">{unavailableReason}</p>}

      {!ai.isLoading && !latest && !unavailableReason && <p className="ai-draft-muted">{AI_DRAFT_COPY.none}</p>}
      {running && <p className="ai-draft-muted">{AI_DRAFT_COPY.generating}</p>}
      {latest?.status === 'failed' && latest.error && (
        <p className="ai-draft-error">
          {AI_DRAFT_COPY.failedPrefix} {latest.error.message}
        </p>
      )}

      {ready?.output && (
        <>
          <p className="ai-draft-summary" dir="auto">
            {ready.output.summary}
          </p>
          <p className="ai-draft-muted">
            {ready.output.workouts.length} workouts · {formatDateTime(ready.completedAt ?? ready.createdAt)}
            {ready.model ? ` · ${ready.model}` : ''}
          </p>
          <p className="ai-draft-note">{AI_DRAFT_COPY.reviewNote}</p>
        </>
      )}

      {ai.startError && <p className="ai-draft-error">{ai.startError}</p>}

      <div className="ai-draft-actions">
        {ready && (
          <Button variant="primary" disabled={disabled} onClick={onUseInNewPlan}>
            {AI_DRAFT_COPY.useInNewPlan}
          </Button>
        )}
        {!unavailableReason && !running && (
          <Button disabled={!canGenerate} onClick={() => void ai.generate()}>
            {!latest ? AI_DRAFT_COPY.generate : latest.status === 'failed' ? AI_DRAFT_COPY.tryAgain : AI_DRAFT_COPY.regenerate}
          </Button>
        )}
      </div>
    </section>
  );
}
