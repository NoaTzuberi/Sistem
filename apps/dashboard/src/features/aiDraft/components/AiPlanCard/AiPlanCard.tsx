import { useState } from 'react';
import { describeSplit, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { RoundButton } from '../../../../components/common/RoundButton/RoundButton';
import { workoutColorClass } from '../../../planBuilder/data/workoutColors';
import { traineesCopy } from '../../../trainees/copy';
import { aiDraftCopy } from '../../copy';
import type { useLatestAiDraft } from '../../hooks/useLatestAiDraft';
import './AiPlanCard.css';

interface AiPlanCardProps {
  ai: ReturnType<typeof useLatestAiDraft<'training_plan'>>;
  /** A week is being picked / a plan created: the actions wait. */
  disabled: boolean;
  /** "Open in the plan builder": a new plan filled from this draft (the week is picked first). */
  onOpenInBuilder: () => void;
  /** The split options, the AI's explanation and "regenerate": the AI draft sheet. */
  onOpenOptions: () => void;
}

/**
 * The trainee's AI training draft as the profile's main card (the pink cloud): the split it
 * recommends, one short line about it, its workouts, and what to check with her first. It only
 * ever opens an EDITABLE plan — the coach reviews and publishes herself.
 */
export function AiPlanCard({ ai, disabled, onOpenInBuilder, onOpenOptions }: AiPlanCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(aiDraftCopy);
  const trainee = useCopy(traineesCopy);
  const { latest, ready, running, unavailableReason } = ai;
  const output = ready?.output;
  const firstOption = output?.splitOptions?.[0];
  // Ticks are the coach's own reminders on this screen; nothing stores them.
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());

  function toggle(item: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (!next.delete(item)) next.add(item);
      return next;
    });
  }

  return (
    <section className="ai-plan-card" aria-label={copy.training.title}>
      <div className="ai-plan-top">
        <span className="ai-plan-tag">
          <span className="ai-plan-tag-dot" aria-hidden="true" />
          {output ? trainee.aiReadyTag : latest ? `${copy.training.title} · ${copy.status[latest.status]}` : copy.training.title}
        </span>
        {output && (
          <RoundButton label={copy.training.regenerate} onClick={onOpenOptions}>
            <Icon name="refresh" size="sm" />
          </RoundButton>
        )}
      </div>

      {output ? (
        <>
          <h2 className="ai-plan-title">{firstOption ? describeSplit(firstOption.splitId, firstOption.daysPerWeek, language) : (output.split ?? copy.training.title)}</h2>
          <p className="ai-plan-lead" dir="auto">
            {output.summary}
          </p>

          <ul className="ai-plan-workouts">
            {output.workouts.map((workout, index) => (
              <li key={`${workout.title}-${index}`} className={`ai-plan-workout ${workoutColorClass(index)}`}>
                <span className="ai-plan-workout-dot" aria-hidden="true" />
                <bdi>{workout.title}</bdi>
              </li>
            ))}
          </ul>

          {output.considerations.length > 0 && (
            <fieldset className="ai-plan-checks">
              <legend className="ai-plan-checks-title">{trainee.checkBeforeStart}</legend>
              {output.considerations.map((item) => (
                <label key={item} className="ai-plan-check">
                  <input type="checkbox" checked={checked.has(item)} onChange={() => toggle(item)} />
                  <span dir="auto">{item}</span>
                </label>
              ))}
            </fieldset>
          )}

          <div className="ai-plan-actions">
            <PillButton variant="primary" disabled={disabled} onClick={onOpenInBuilder}>
              {trainee.openInBuilder}
            </PillButton>
            <PillButton className="ai-plan-soft" disabled={disabled} onClick={onOpenOptions}>
              {trainee.otherSplits}
            </PillButton>
            <span className="ai-plan-meta">{trainee.draftOnlyYou}</span>
          </div>
        </>
      ) : (
        <>
          <div className="ai-plan-state" aria-live="polite">
            {ai.isLoading && <p>{shared.common.loading}</p>}
            {ai.error && <p className="ai-plan-error">{ai.error}</p>}
            {unavailableReason && <p>{unavailableReason}</p>}
            {!ai.isLoading && !latest && !unavailableReason && <p>{copy.training.none}</p>}
            {running && <p>{copy.training.generating}</p>}
            {latest?.status === 'failed' && latest.error && (
              <p className="ai-plan-error">
                {copy.training.failedPrefix} {latest.error.message}
              </p>
            )}
            {ai.startError && <p className="ai-plan-error">{ai.startError}</p>}
          </div>
          {!unavailableReason && !running && !ai.isLoading && (
            <div className="ai-plan-actions">
              <PillButton variant="primary" disabled={ai.isStarting} onClick={() => void ai.generate()}>
                {latest?.status === 'failed' ? copy.training.tryAgain : copy.training.generate}
              </PillButton>
            </div>
          )}
        </>
      )}
    </section>
  );
}
