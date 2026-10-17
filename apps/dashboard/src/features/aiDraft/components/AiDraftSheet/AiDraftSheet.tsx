import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { AiSplitOption, AiTrainingRecommendation, TrainingConfig } from '@sistem/types';
import { describeSplit, fill, formatDateTime, sharedCopy, splitLabel, useCopy, useLanguage } from '@sistem/shared';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { Select } from '../../../../components/common/Select/Select';
import { SideSheet } from '../../../../components/common/SideSheet/SideSheet';
import { aiDraftCopy } from '../../copy';
import type { useLatestAiDraft } from '../../hooks/useLatestAiDraft';
import { useSplitChoice } from '../../hooks/useSplitChoice';
import { AiRationalePanel } from '../AiRationalePanel/AiRationalePanel';
import './AiDraftSheet.css';

interface AiDraftSheetProps {
  isOpen: boolean;
  onClose: () => void;
  traineeId: string;
  ai: ReturnType<typeof useLatestAiDraft<'training_plan'>>;
  /** The coach's splits (the "regenerate for" list); null while loading. */
  config: TrainingConfig | null;
  /** The draft this plan was loaded from, when it is not the newest one: its explanation is shown. */
  linkedRecommendationId: string | undefined;
  /** Loading into the plan is allowed (a draft plan — a published one is live for the trainee). */
  canApply: boolean;
  /** Load the AI's whole plan into the editable plan. */
  onUseFullPlan: (recommendation: AiTrainingRecommendation) => void;
  /** Only the split: typed, empty workouts; the AI's picks are offered in their slots. */
  onUseSplitOnly: (option: Pick<AiSplitOption, 'splitId' | 'daysPerWeek'>, recommendation: AiTrainingRecommendation) => void;
}

/**
 * The AI training draft, reviewed in a side sheet: its split options as selectable cards, the
 * AI's explanation, and the coach's three paths — use the full plan, use the split only,
 * regenerate. Everything it loads goes into the EDITABLE plan; nothing here publishes.
 */
export function AiDraftSheet({ isOpen, onClose, traineeId, ai, config, linkedRecommendationId, canApply, onUseFullPlan, onUseSplitOnly }: AiDraftSheetProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(aiDraftCopy);
  const { latest, ready, running, unavailableReason } = ai;
  const { options, selectedIndex, select, option, hasPlanForSelection } = useSplitChoice(ready);
  const [regenerateFor, setRegenerateFor] = useState('');
  const canGenerate = !unavailableReason && !running && !ai.isStarting;
  const output = ready?.output;
  const reviewId = linkedRecommendationId ?? ready?.id;

  const days = ready?.input?.profile.trainingDays;
  const outsideDays = (splitId: string) => {
    const split = config?.splits.find((entry) => entry.id === splitId);
    if (!split || !days) return false;
    return !Object.keys(split.days).some((count) => Number(count) >= days.min && Number(count) <= Math.min(days.max, 6));
  };
  const requestedSplitId = ready?.input?.requestedSplitId;

  // A selected option the draft has no plan for: "regenerate" builds the plan for that split.
  const generatesForOption = Boolean(option && !hasPlanForSelection && !regenerateFor);
  const generateLabel = !latest
    ? copy.training.generate
    : latest.status === 'failed'
      ? copy.training.tryAgain
      : generatesForOption
        ? copy.training.generateForSplit
        : copy.training.regenerate;

  function handleGenerate() {
    const splitId = regenerateFor || (generatesForOption ? option?.splitId : undefined);
    void ai.generate(splitId ? { splitId } : {});
  }

  // Radio group keys: the arrows move the choice (and the focus) between the option cards.
  function handleOptionKeys(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp';
    if (!step || options.length === 0) return;
    event.preventDefault();
    const forward = event.key === 'ArrowDown' || event.key === (language === 'he' ? 'ArrowLeft' : 'ArrowRight');
    const next = (selectedIndex + (forward ? 1 : -1) + options.length) % options.length;
    select(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={copy.training.title}
      subtitle={
        output
          ? `${fill(copy.training.workoutCount, { count: output.workouts.length })} · ${formatDateTime(ready.completedAt ?? ready.createdAt, language)}`
          : latest
            ? copy.status[latest.status]
            : undefined
      }
      footer={
        <>
          {ready && (
            <PillButton variant="primary" disabled={!canApply || !hasPlanForSelection} onClick={() => onUseFullPlan(ready)}>
              {copy.training.useFullPlan}
            </PillButton>
          )}
          {!unavailableReason && !running && latest?.status === 'ready' && (
            <label className="ai-sheet-regenerate">
              <span>{copy.training.regenerateFor}</span>
              <Select className="ai-sheet-select" value={regenerateFor} onChange={(event) => setRegenerateFor(event.target.value)}>
                <option value="">{copy.training.aiChooses}</option>
                {config?.splits
                  .filter((split) => split.enabled)
                  .map((split) => (
                    <option key={split.id} value={split.id}>
                      {splitLabel(split.id, language)}
                      {outsideDays(split.id) ? ` (${copy.training.outsideDays})` : ''}
                    </option>
                  ))}
              </Select>
            </label>
          )}
          <div className="ai-sheet-secondary">
            {ready && option && (
              <PillButton variant="fill" disabled={!canApply} onClick={() => onUseSplitOnly(option, ready)}>
                {copy.training.useSplitOnly}
              </PillButton>
            )}
            {!unavailableReason && (
              <PillButton variant="fill" disabled={!canGenerate} onClick={handleGenerate}>
                {generateLabel}
              </PillButton>
            )}
          </div>
        </>
      }
    >
      <div className="ai-sheet-status" aria-live="polite">
        {ai.isLoading && <p className="ai-sheet-muted">{shared.common.loading}</p>}
        {ai.error && <p className="ai-sheet-error">{ai.error}</p>}
        {unavailableReason && <p className="ai-sheet-muted">{unavailableReason}</p>}
        {!ai.isLoading && !latest && !unavailableReason && <p className="ai-sheet-muted">{copy.training.none}</p>}
        {running && <p className="ai-sheet-muted">{copy.training.generating}</p>}
        {latest?.status === 'failed' && latest.error && (
          <p className="ai-sheet-error">
            {copy.training.failedPrefix} {latest.error.message}
          </p>
        )}
        {ai.startError && <p className="ai-sheet-error">{ai.startError}</p>}
      </div>

      {output && options.length > 0 && (
        <div className="ai-sheet-options" role="radiogroup" aria-label={copy.training.splitOptions} onKeyDown={handleOptionKeys}>
          {options.map((entry, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={entry.splitId}
                className="split-option"
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(index)}
              >
                <span className="split-option-top">
                  <span className="split-option-radio" aria-hidden="true" />
                  <span className="split-option-title">{describeSplit(entry.splitId, entry.daysPerWeek, language)}</span>
                  {index === 0 && (
                    <span className="split-option-tag split-option-tag-solid">
                      {entry.splitId === requestedSplitId ? copy.training.requested : copy.training.recommended}
                    </span>
                  )}
                  {index === 0 && entry.splitId === output.splitId && <span className="split-option-tag">{copy.training.drafted}</span>}
                </span>
                <span className="split-option-why" dir="auto">
                  {entry.why}
                </span>
                {isSelected && (
                  <span className="split-option-points">
                    {entry.pros.map((point) => (
                      <span key={point} className="split-option-point">
                        <span className="split-option-plus" aria-label={copy.training.pros}>
                          +
                        </span>
                        <span dir="auto">{point}</span>
                      </span>
                    ))}
                    {entry.cons.map((point) => (
                      <span key={point} className="split-option-point">
                        <span className="split-option-minus" aria-label={copy.training.cons}>
                          −
                        </span>
                        <span dir="auto">{point}</span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {output && options.length === 0 && <p className="ai-sheet-muted">{copy.training.legacyNote}</p>}

      {(output || linkedRecommendationId) && <p className="ai-sheet-note">{copy.training.reviewNote}</p>}

      {reviewId && <AiRationalePanel traineeId={traineeId} recommendationId={reviewId} recommendation={latest} startClosed />}
    </SideSheet>
  );
}
