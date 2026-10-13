import { useEffect, useId, useRef } from 'react';
import { fill, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { aiDraftCopy } from '../../../aiDraft/copy';
import { weekTileLabel } from '../../data/planWeeks';
import type { NewPlanPopoverState, PlanStartMethod } from '../../hooks/useNewPlanPopover';
import { useRadioGroupKeys } from '../../hooks/useRadioGroupKeys';
import { traineesCopy } from '../../copy';
import './NewPlanPopover.css';

interface NewPlanPopoverProps {
  popover: NewPlanPopoverState;
  /** How many workouts the AI draft that would be loaded has; undefined = there is no ready draft. */
  aiWorkoutCount: number | undefined;
  /** "Other split options": the AI draft sheet (split cards, regenerate). */
  onOpenAiOptions: () => void;
}

/**
 * "New plan": for which week, and how to start. A popover under the Plans toolbar — it grows
 * from its corner, closes on Esc / a press outside / ✕, and gives the focus back to what opened
 * it. A week that already has a plan cannot be started again: the button opens that plan.
 */
export function NewPlanPopover({ popover, aiWorkoutCount, onOpenAiOptions }: NewPlanPopoverProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const ai = useCopy(aiDraftCopy);
  const handleRadioKeys = useRadioGroupKeys();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { isOpen, close, week, weeks, method } = popover;
  const hasWeeks = weeks.length > 0;

  // Esc and a press outside close it; the focus returns to whatever opened it.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [isOpen, close]);

  // Once the weeks are in, the selected week takes the focus.
  useEffect(() => {
    if (isOpen && hasWeeks) panelRef.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus();
  }, [isOpen, hasWeeks]);

  if (!isOpen) return null;

  const isTaken = Boolean(week?.plan);
  const methods: { id: PlanStartMethod; label: string; hint: string; disabled: boolean }[] = [
    { id: 'scratch', label: copy.startScratch, hint: copy.fromScratchHint, disabled: false },
    {
      id: 'duplicate',
      label: copy.duplicateLastWeek,
      hint: week?.copiesFromWeek ? fill(copy.copiesFrom, { week: formatWeekSpan(week.copiesFromWeek, language) }) : copy.nothingToCopy,
      disabled: !popover.canDuplicate,
    },
    {
      id: 'ai',
      label: ai.training.title,
      hint: popover.canUseAi ? (aiWorkoutCount !== undefined ? fill(ai.training.workoutCount, { count: aiWorkoutCount }) : ai.status.ready) : ai.training.none,
      disabled: !popover.canUseAi,
    },
  ];

  return (
    <div className="new-plan" ref={panelRef} role="dialog" aria-labelledby={titleId}>
      <header className="new-plan-head">
        <div>
          <h2 className="new-plan-title" id={titleId}>
            {copy.newPlan}
          </h2>
          <p className="new-plan-subtitle">{copy.newPlanSubtitle}</p>
        </div>
        <button className="new-plan-close" type="button" aria-label={shared.common.close} onClick={close}>
          <Icon name="close" size="sm" />
        </button>
      </header>

      {popover.isLoading && <p className="new-plan-loading">{shared.common.loading}</p>}

      {hasWeeks && popover.currentWeekStart && (
        <>
          <p className="new-plan-label" id={`${titleId}-week`}>
            {copy.weekGroup}
          </p>
          <div className="new-plan-weeks" role="radiogroup" aria-labelledby={`${titleId}-week`} onKeyDown={handleRadioKeys}>
            {weeks.map((entry) => {
              const isSelected = entry.weekStartDate === week?.weekStartDate;
              return (
                <button
                  key={entry.weekStartDate}
                  className="week-tile"
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => popover.selectWeek(entry.weekStartDate)}
                >
                  <span className="week-tile-label">{weekTileLabel(entry, popover.currentWeekStart!, language)}</span>
                  <span className="week-tile-dates">{formatWeekSpan(entry.weekStartDate, language)}</span>
                  <span className={`week-tile-status week-tile-status-${entry.plan?.status ?? 'free'}`}>
                    {entry.plan ? shared.coach.planStatus[entry.plan.status] : copy.weekFree}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="new-plan-label" id={`${titleId}-how`}>
            {copy.howToStart}
          </p>
          <div className="new-plan-methods" role="radiogroup" aria-labelledby={`${titleId}-how`} onKeyDown={handleRadioKeys}>
            {methods.map((entry) => {
              const isSelected = !isTaken && entry.id === method;
              return (
                <button
                  key={entry.id}
                  className="start-method"
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  // A taken week opens its plan: there is nothing to start.
                  disabled={isTaken || entry.disabled}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => popover.selectMethod(entry.id)}
                >
                  <span className="start-method-label">{entry.label}</span>
                  <span className="start-method-hint">{entry.hint}</span>
                </button>
              );
            })}
          </div>

          <button className="new-plan-link" type="button" onClick={onOpenAiOptions}>
            {copy.otherSplits}
          </button>
        </>
      )}

      {isTaken && week?.plan && (
        <p className="new-plan-note" role="status">
          {fill(copy.weekTakenNote, { status: shared.coach.planStatus[week.plan.status] })}
        </p>
      )}
      {popover.error && (
        <p className="new-plan-error" role="alert">
          {popover.error}
        </p>
      )}

      <div className="new-plan-actions">
        <PillButton variant="primary" className="new-plan-confirm" disabled={!week || popover.isCreating} onClick={() => void popover.confirm()}>
          {isTaken ? copy.openExisting : week ? fill(copy.createFor, { range: formatWeekSpan(week.weekStartDate, language) }) : copy.newPlan}
        </PillButton>
        <PillButton variant="fill" disabled={popover.isCreating} onClick={close}>
          {shared.common.cancel}
        </PillButton>
      </div>
    </div>
  );
}
