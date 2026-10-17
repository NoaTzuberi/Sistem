import { useState } from 'react';
import type { ExerciseFacts, ExerciseFamilySummary, TrainingSlot } from '@sistem/types';
import { fill, formatPlural, humanizeId, patternLabel, sharedCopy, slotLabel, useCopy, useLanguage, variantLabel } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { Select } from '../../../../components/common/Select/Select';
import { SideSheet } from '../../../../components/common/SideSheet/SideSheet';
import { Switch } from '../../../../components/common/Switch/Switch';
import { DIFFICULTY_FILTERS, PATTERN_FILTERS } from '../../data/exerciseFilters';
import { defaultVariant, variantFacts } from '../../data/familyFacts';
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary';
import type { LibraryDifficulty } from '../../hooks/useExerciseLibrary';
import { planBuilderCopy } from '../../copy';
import './LibrarySheet.css';

/** The slot a sheet was opened for ("+ Add" on a slot): its list starts on that slot's exercises. */
export interface LibraryTargetSlot {
  workoutType: string;
  slot: TrainingSlot;
}

interface LibrarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  traineeId: string;
  /** Title of the workout an item is added to. */
  targetTitle: string;
  targetSlot?: LibraryTargetSlot;
  /** Adds the exercise; false when it was refused (the slot is full). */
  onAdd: (exercise: ExerciseFacts) => boolean;
}

/**
 * The exercise library in a side sheet: search, movement-pattern pills, level, and one row per
 * exercise family (Phase 12b). Opened from a slot it lists that slot's families, with her
 * equipment only — both can be switched off. Pressing a row adds the variant she can do and the
 * sheet stays open for the next one; "Done" closes it. Variants her equipment rules out are
 * marked, never hidden.
 */
export function LibrarySheet({ isOpen, onClose, traineeId, targetTitle, targetSlot, onAdd }: LibrarySheetProps) {
  const language = useLanguage();
  const copy = useCopy(planBuilderCopy);
  const title = targetTitle || copy.untitledWorkout;
  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={copy.addExerciseTitle}
      subtitle={targetSlot ? fill(copy.addExerciseToSlot, { title, slot: slotLabel(targetSlot.slot, language) }) : fill(copy.addExerciseTo, { title })}
      footer={
        <PillButton variant="dark" onClick={onClose}>
          {copy.done}
        </PillButton>
      }
    >
      {/* Mounted with the sheet: each opening starts from a fresh search, on its own slot. */}
      <LibraryList traineeId={traineeId} targetSlot={targetSlot} onAdd={onAdd} />
    </SideSheet>
  );
}

function LibraryList({ traineeId, targetSlot, onAdd }: Pick<LibrarySheetProps, 'traineeId' | 'targetSlot' | 'onAdd'>) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const library = useExerciseLibrary(traineeId, targetSlot && { workoutType: targetSlot.workoutType, slotId: targetSlot.slot.id });
  // Families added while the sheet is open: their "+" stays filled.
  const [addedIds, setAddedIds] = useState<ReadonlySet<string>>(new Set());
  // On a slot the pills are that slot's own patterns (when it has more than one); else all of them.
  const inSlot = targetSlot !== undefined && !library.showAll;
  const patterns = inSlot ? (targetSlot.slot.patterns.length > 1 ? targetSlot.slot.patterns : []) : PATTERN_FILTERS;

  function add(family: ExerciseFamilySummary) {
    const variant = defaultVariant(family);
    if (!variant) return;
    if (onAdd(variantFacts(family, variant))) setAddedIds((current) => new Set(current).add(family.id));
  }

  function toggleShowAll() {
    library.setPattern('');
    library.setShowAll(!library.showAll);
  }

  return (
    <>
      <label className="library-search">
        <Icon name="search" size="sm" />
        <input
          className="library-search-input"
          type="search"
          dir="auto"
          data-autofocus=""
          placeholder={copy.searchExercises}
          aria-label={copy.searchExercises}
          value={library.search}
          onChange={(event) => library.setSearch(event.target.value)}
        />
      </label>

      {patterns.length > 0 && (
        <div className="library-pills" role="group" aria-label={copy.pattern}>
          <button className="library-pill" type="button" aria-pressed={library.pattern === ''} onClick={() => library.setPattern('')}>
            {copy.all}
          </button>
          {patterns.map((option) => (
            <button key={option} className="library-pill" type="button" aria-pressed={library.pattern === option} onClick={() => library.setPattern(option)}>
              {patternLabel(option, language)}
            </button>
          ))}
        </div>
      )}

      <div className="library-filters">
        <Select
          className="library-level"
          aria-label={copy.level}
          value={library.difficulty}
          onChange={(event) => library.setDifficulty(event.target.value as LibraryDifficulty | '')}
        >
          <option value="">{copy.levelAny}</option>
          {DIFFICULTY_FILTERS.map((option) => (
            <option key={option} value={option}>
              {shared.training.levels[option]}
            </option>
          ))}
        </Select>
        <Switch className="library-check" label={copy.pickerEquipmentOnly} checked={library.equipmentOnly} onChange={library.setEquipmentOnly} />
        {targetSlot && (
          <button className="library-link" type="button" onClick={toggleShowAll}>
            {library.showAll ? copy.pickerBackToSlot : copy.pickerShowAll}
          </button>
        )}
      </div>

      {library.recent.length > 0 && (
        <div className="library-recent">
          <span className="library-recent-label">{copy.pickerRecent}</span>
          {library.recent.map((family) => (
            <button key={family.id} className="library-pill" type="button" onClick={() => add(family)}>
              <bdi>{family.name}</bdi>
            </button>
          ))}
        </div>
      )}

      {library.error && (
        <p className="library-message" role="alert">
          {library.error}{' '}
          <PillButton variant="fill" size="sm" onClick={library.retry}>
            {shared.common.retry}
          </PillButton>
        </p>
      )}
      {!library.error && !library.isLoading && library.items.length === 0 && <p className="library-message">{copy.noExercises}</p>}

      <ul className="library-list">
        {library.items.map((family) => (
          <li key={family.id}>
            <button
              className={addedIds.has(family.id) ? 'library-item library-item-added' : 'library-item'}
              type="button"
              aria-label={fill(copy.addNamed, { name: family.name })}
              disabled={family.variants.length === 0}
              onClick={() => add(family)}
            >
              <span className="library-item-text">
                <bdi className="library-item-name">{family.name}</bdi>
                <span className="library-item-facts">
                  {[...family.patterns.map((id) => patternLabel(id, language)), ...family.muscles.map(humanizeId)].join(' · ')}
                </span>
                <span className="library-item-facts">
                  {formatPlural(language, copy.variantsCount, family.variants.length)}
                  {': '}
                  {family.variants.map((variant) => (
                    <span key={variant.exerciseId} className={variant.allowed === false ? 'library-variant-off' : undefined}>
                      {variantLabel(variant.variant, language)}{' '}
                    </span>
                  ))}
                </span>
              </span>
              <span className="library-item-plus" aria-hidden="true">
                <Icon name={addedIds.has(family.id) ? 'check' : 'plus'} size="sm" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {library.isLoading && <p className="library-message">{shared.common.loading}</p>}
      {!library.isLoading && library.items.length < library.total && (
        <PillButton variant="fill" size="sm" onClick={library.loadMore}>
          {fill(copy.loadMore, { shown: library.items.length, total: library.total })}
        </PillButton>
      )}
    </>
  );
}
