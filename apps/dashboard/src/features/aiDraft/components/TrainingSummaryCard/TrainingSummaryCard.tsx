import { useState } from 'react';
import type { AiSplitOption } from '@sistem/types';
import {
  describeSplit,
  fill,
  formatDateTime,
  sharedCopy,
  splitLabel,
  useCopy,
  useLanguage,
} from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { useTrainingConfig } from '../../../trainingConfig/useTrainingConfig';
import { aiDraftCopy } from '../../copy';
import type { useLatestAiDraft } from '../../hooks/useLatestAiDraft';
import './TrainingSummaryCard.css';

interface TrainingSummaryCardProps {
  ai: ReturnType<typeof useLatestAiDraft<'training_plan'>>;
  /** Path a: the AI's whole plan as an editable draft (week picker first). */
  onUseFullPlan: () => void;
  /** Path b: only the split — typed workouts with empty slots, the AI's picks as suggestions. */
  onUseSplitOnly: (option: Pick<AiSplitOption, 'splitId' | 'daysPerWeek'>) => void;
  disabled?: boolean;
}

/**
 * Trainee → Plans (Phase 12b): the AI's "Training summary" — how it reads her, 1–3 split options
 * with pros / cons, and the coach's paths: use the full plan, use the split only, or regenerate
 * (the same split, an option, or any split of her config). Phase 12 drafts show as one plan.
 */
export function TrainingSummaryCard({ ai, onUseFullPlan, onUseSplitOnly, disabled = false }: TrainingSummaryCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(aiDraftCopy);
  const config = useTrainingConfig();
  const { latest, ready, running, unavailableReason } = ai;
  const [selected, setSelected] = useState(0);
  const [regenerateFor, setRegenerateFor] = useState('');
  const canGenerate = !unavailableReason && !running && !ai.isStarting && !disabled;

  const output = ready?.output;
  const options = output?.splitOptions ?? [];
  const option = options[selected] ?? options[0];
  // The plan in the draft is for option 1 (its split and days).
  const isDrafted = Boolean(option && output && selected === 0 && option.splitId === output.splitId);
  const days = ready?.input?.profile.trainingDays;
  const outsideDays = (splitId: string) => {
    const split = config?.splits.find((entry) => entry.id === splitId);
    if (!split || !days) return false;
    return !Object.keys(split.days).some((count) => Number(count) >= days.min && Number(count) <= Math.min(days.max, 6));
  };
  const requestedSplitId = ready?.input?.requestedSplitId;

  return (
    <section className="training-summary" aria-live="polite">
      <header className="training-summary-header">
        <h2 className="training-summary-title">{copy.training.summaryTitle}</h2>
        {latest && (
          <Badge tone={latest.status === 'failed' ? 'alert' : latest.status === 'ready' ? 'accent' : 'neutral'}>{copy.status[latest.status]}</Badge>
        )}
      </header>

      {ai.isLoading && <p className="training-summary-muted">{shared.common.loading}</p>}
      {ai.error && <p className="training-summary-error">{ai.error}</p>}
      {unavailableReason && <p className="training-summary-muted">{unavailableReason}</p>}
      {!ai.isLoading && !latest && !unavailableReason && <p className="training-summary-muted">{copy.training.none}</p>}
      {running && <p className="training-summary-muted">{copy.training.generating}</p>}
      {latest?.status === 'failed' && latest.error && (
        <p className="training-summary-error">
          {copy.training.failedPrefix} {latest.error.message}
        </p>
      )}

      {output && (
        <>
          <p className="training-summary-text" dir="auto">
            {output.summary}
          </p>
          {output.experienceRead && (
            <p className="training-summary-text">
              <span className="training-summary-label">{copy.training.experience}: </span>
              <span dir="auto">{output.experienceRead}</span>
            </p>
          )}
          {output.considerations.length > 0 && (
            <div>
              <p className="training-summary-label">{copy.training.considerations}</p>
              <ul className="training-summary-list">
                {output.considerations.map((item) => (
                  <li key={item} dir="auto">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {options.length > 0 ? (
            <fieldset className="training-summary-options">
              <legend className="training-summary-label">{copy.training.splitOptions}</legend>
              {options.map((entry, index) => (
                <label key={entry.splitId} className={'training-summary-option' + (index === selected ? ' training-summary-option-selected' : '')}>
                  <input type="radio" name="split-option" checked={index === selected} onChange={() => setSelected(index)} />
                  <span className="training-summary-option-body">
                    <span className="training-summary-option-title">
                      {index + 1}. {describeSplit(entry.splitId, entry.daysPerWeek, language)}
                      {index === 0 && <Badge tone="accent">{entry.splitId === requestedSplitId ? copy.training.requested : copy.training.recommended}</Badge>}
                      {index === 0 && entry.splitId === output.splitId && <Badge>{copy.training.drafted}</Badge>}
                    </span>
                    <span className="training-summary-option-why" dir="auto">
                      {entry.why}
                    </span>
                    <span className="training-summary-points">
                      <span>
                        <span className="training-summary-plus">+ {copy.training.pros}: </span>
                        <span dir="auto">{entry.pros.join(' · ')}</span>
                      </span>
                      <span>
                        <span className="training-summary-minus">− {copy.training.cons}: </span>
                        <span dir="auto">{entry.cons.join(' · ')}</span>
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="training-summary-muted">{copy.training.legacyNote}</p>
          )}

          <p className="training-summary-muted">
            {fill(copy.training.workoutCount, { count: output.workouts.length })} · {formatDateTime(ready.completedAt ?? ready.createdAt, language)}
            {ready.model ? ` · ${ready.model}` : ''}
          </p>
          <p className="training-summary-note">{copy.training.reviewNote}</p>
        </>
      )}

      {ai.startError && <p className="training-summary-error">{ai.startError}</p>}

      <div className="training-summary-actions">
        {ready && (options.length === 0 || isDrafted) && (
          <Button variant="primary" disabled={disabled} onClick={onUseFullPlan}>
            {options.length === 0 ? copy.training.useInNewPlan : copy.training.useFullPlan}
          </Button>
        )}
        {option && (
          <Button disabled={disabled} onClick={() => onUseSplitOnly(option)}>
            {copy.training.useSplitOnly}
          </Button>
        )}
        {option && !isDrafted && !unavailableReason && (
          <Button disabled={!canGenerate} onClick={() => void ai.generate({ splitId: option.splitId })}>
            {copy.training.generateForSplit}
          </Button>
        )}
      </div>

      {!unavailableReason && !running && (
        <div className="training-summary-regenerate">
          {latest?.status === 'ready' && (
            <label className="training-summary-regenerate-for">
              <span>{copy.training.regenerateFor}</span>
              <select className="training-summary-select" value={regenerateFor} onChange={(event) => setRegenerateFor(event.target.value)}>
                <option value="">{copy.training.aiChooses}</option>
                {config?.splits
                  .filter((split) => split.enabled)
                  .map((split) => (
                    <option key={split.id} value={split.id}>
                      {splitLabel(split.id, language)}
                      {outsideDays(split.id) ? ` (${copy.training.outsideDays})` : ''}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <Button disabled={!canGenerate} onClick={() => void ai.generate(regenerateFor ? { splitId: regenerateFor } : {})}>
            {!latest ? copy.training.generate : latest.status === 'failed' ? copy.training.tryAgain : copy.training.regenerate}
          </Button>
        </div>
      )}
    </section>
  );
}
