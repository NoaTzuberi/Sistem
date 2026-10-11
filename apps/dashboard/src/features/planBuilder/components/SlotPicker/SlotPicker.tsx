import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ExerciseFacts, ExerciseFamilySearchResult, ExerciseFamilySummary, PatternId, TrainingSlot } from '@sistem/types';
import {
  formatPlural,
  getActiveLanguage,
  patternLabel,
  searchByText,
  sharedCopy,
  useCopy,
  useLanguage,
  variantLabel,
} from '@sistem/shared';
import { searchExerciseFamilies } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { DIFFICULTY_FILTERS } from '../../data/exerciseFilters';
import { defaultVariant, familySearchText, variantFacts } from '../../data/familyFacts';
import { planBuilderCopy } from '../../copy';
import './SlotPicker.css';

const SEARCH_DEBOUNCE_MS = 300;
/** A slot's whole list is loaded once and searched here (typo-tolerant); "Show all" searches on the server. */
const SLOT_LIMIT = 500;
const ALL_LIMIT = 50;

interface SlotPickerProps {
  traineeId: string;
  /** The slot it fills; without one it opens on "Show all". */
  workoutType?: string;
  slot?: TrainingSlot;
  title: string;
  onPick: (facts: ExerciseFacts) => void;
  onClose: () => void;
}

/**
 * Phase 12b: adds an exercise to a slot. Lists exercise FAMILIES that fit the slot (pattern), with
 * her equipment and level — one row per family, its variants listed; a pick adds the variant she can
 * do (the coach swaps it in the row in one click). Pattern chips narrow, "Show all" drops the slot
 * filter. Keyboard: type to search, ↑ / ↓ and Enter to add, Esc to close.
 */
export function SlotPicker({ traineeId, workoutType, slot, title, onPick, onClose }: SlotPickerProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const [showAll, setShowAll] = useState(!slot);
  const [chips, setChips] = useState<PatternId[]>([]);
  const [equipmentOnly, setEquipmentOnly] = useState(true);
  const [level, setLevel] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [result, setResult] = useState<ExerciseFamilySearchResult | null>(null);
  const [error, setError] = useState<string>();
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const latest = useRef(0);
  const listId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Slot mode loads the slot's list (search runs here); "Show all" asks the server per search.
  const serverQuery = showAll ? debouncedQuery : '';
  useEffect(() => {
    const request = ++latest.current;
    setError(undefined);
    const params = showAll
      ? { traineeId, equipmentOnly, levels: level || undefined, search: serverQuery || undefined, limit: ALL_LIMIT }
      : {
          traineeId,
          workoutType,
          slotId: slot?.id,
          patterns: chips.length > 0 ? chips.join(',') : undefined,
          equipmentOnly,
          levels: level || undefined,
          limit: SLOT_LIMIT,
        };
    searchExerciseFamilies(params)
      .then((data) => request === latest.current && setResult(data))
      .catch(() => request === latest.current && setError(planBuilderCopy[getActiveLanguage()].pickerLoadError));
  }, [traineeId, workoutType, slot?.id, showAll, chips, equipmentOnly, level, serverQuery]);

  const results = useMemo(() => {
    const items = result?.items ?? [];
    return showAll ? items : searchByText(items, query, familySearchText);
  }, [result, showAll, query]);
  const recent = !query && !showAll ? (result?.recent ?? []) : [];

  useEffect(() => searchRef.current?.focus(), [showAll]);
  useEffect(() => setActive(0), [results]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function pick(family: ExerciseFamilySummary) {
    const variant = defaultVariant(family);
    if (!variant) return;
    onPick(variantFacts(family, variant));
  }

  function toggleChip(pattern: PatternId) {
    setChips((current) => (current.includes(pattern) ? current.filter((p) => p !== pattern) : [...current, pattern]));
  }

  function handleSearchKeys(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[active]) pick(results[active]);
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onClose();
  }

  function variantsLine(family: ExerciseFamilySummary) {
    return family.variants.map((variant) => (
      <span key={variant.exerciseId} className={variant.allowed === false ? 'slot-picker-variant slot-picker-variant-off' : 'slot-picker-variant'}>
        {variantLabel(variant.variant, language)}
      </span>
    ));
  }

  return (
    <div className="slot-picker" role="dialog" aria-label={showAll ? copy.pickerAllTitle : title} onKeyDown={handleEscape}>
      <div className="slot-picker-head">
        <span className="slot-picker-title">{showAll ? copy.pickerAllTitle : title}</span>
        <Button size="sm" onClick={onClose} aria-label={copy.pickerClose}>
          ✕
        </Button>
      </div>

      {!showAll && slot && slot.patterns.length > 1 && (
        <div className="slot-picker-chips" role="group" aria-label={copy.pattern}>
          {slot.patterns.map((pattern) => (
            <button
              key={pattern}
              type="button"
              className="slot-picker-chip"
              aria-pressed={chips.includes(pattern)}
              onClick={() => toggleChip(pattern)}
            >
              {patternLabel(pattern, language)}
            </button>
          ))}
        </div>
      )}

      <div className="slot-picker-filters">
        <label className="slot-picker-check">
          <input type="checkbox" checked={equipmentOnly} onChange={(event) => setEquipmentOnly(event.target.checked)} />
          <span>{copy.pickerEquipmentOnly}</span>
        </label>
        <select className="slot-picker-select" aria-label={copy.level} value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="">{copy.levelAny}</option>
          {DIFFICULTY_FILTERS.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {shared.training.levels[difficulty]}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={searchRef}
        className="slot-picker-search"
        type="search"
        dir="auto"
        value={query}
        placeholder={copy.searchExercises}
        aria-label={copy.searchExercises}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleSearchKeys}
      />

      {recent.length > 0 && (
        <div className="slot-picker-recent">
          <span className="slot-picker-label">{copy.pickerRecent}</span>
          {recent.map((family) => (
            <button key={family.id} type="button" className="slot-picker-recent-item" dir="auto" onClick={() => pick(family)}>
              <bdi>{family.name}</bdi>
            </button>
          ))}
        </div>
      )}

      {error && <p className="slot-picker-error" role="alert">{error}</p>}
      {!result && !error && <p className="slot-picker-muted">{shared.common.loading}</p>}

      <ul ref={listRef} id={listId} className="slot-picker-results" role="listbox" aria-label={copy.pickerResults}>
        {result && results.length === 0 && <li className="slot-picker-muted">{copy.pickerEmpty}</li>}
        {results.map((family, index) => (
          <li
            key={family.id}
            id={`${listId}-${index}`}
            data-index={index}
            role="option"
            aria-selected={index === active}
            className={'slot-picker-result' + (index === active ? ' slot-picker-result-active' : '')}
            onMouseEnter={() => setActive(index)}
            onClick={() => pick(family)}
          >
            <span className="slot-picker-name" dir="auto">
              <bdi>{family.name}</bdi>
            </span>
            <span className="slot-picker-meta">
              {family.patterns.map((pattern) => patternLabel(pattern, language)).join(' · ')}
              {' · '}
              {formatPlural(language, copy.variantsCount, family.variants.length)}
            </span>
            <span className="slot-picker-variants">
              {family.variants.every((variant) => variant.allowed === false) && <span className="slot-picker-off-tag">{copy.notForHer}</span>}
              {variantsLine(family)}
            </span>
          </li>
        ))}
      </ul>

      <div className="slot-picker-foot">
        {slot && (
          <Button size="sm" onClick={() => setShowAll((current) => !current)}>
            {showAll ? copy.pickerBackToSlot : copy.pickerShowAll}
          </Button>
        )}
        <span className="slot-picker-hint">{copy.pickerHint}</span>
      </div>
    </div>
  );
}
