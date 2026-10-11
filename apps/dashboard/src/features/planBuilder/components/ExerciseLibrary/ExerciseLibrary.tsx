import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFacts, ExerciseFamilySummary, PatternId } from '@sistem/types';
import { searchExerciseFamilies } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import {
  fill,
  formatPlural,
  getActiveLanguage,
  patternLabel,
  sharedCopy,
  useCopy,
  useLanguage,
  variantLabel,
} from '@sistem/shared';
import { DIFFICULTY_FILTERS, PATTERN_FILTERS } from '../../data/exerciseFilters';
import { defaultVariant, variantFacts } from '../../data/familyFacts';
import './ExerciseLibrary.css';

type Difficulty = (typeof DIFFICULTY_FILTERS)[number];
import { planBuilderCopy } from '../../copy';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

interface ExerciseLibraryProps {
  traineeId: string;
  /** Title of the workout copy.add adds to; undefined while the plan has no workout. */
  targetTitle: string | undefined;
  onAdd: (exercise: ExerciseFacts) => void;
}

/**
 * The whole coach library, one row per exercise family (Phase 12b): search, movement pattern and
 * level. Add puts the variant she can do into the selected workout (its first fitting slot); the
 * coach swaps the variant in the row. Variants her equipment rules out are marked, never hidden.
 */
export function ExerciseLibrary({ traineeId, targetTitle, onAdd }: ExerciseLibraryProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pattern, setPattern] = useState<PatternId | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [items, setItems] = useState<ExerciseFamilySummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  // Only the newest request may write its answer.
  const latestRequest = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (nextPage: number) => {
      const request = ++latestRequest.current;
      setIsLoading(true);
      try {
        const result = await searchExerciseFamilies({
          search: debouncedSearch || undefined,
          patterns: pattern || undefined,
          levels: difficulty || undefined,
          traineeId,
          equipmentOnly: false,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        if (request !== latestRequest.current) return;
        setItems((current) => (nextPage === 1 ? result.items : [...current, ...result.items]));
        setPage(nextPage);
        setTotal(result.total);
        setError(undefined);
      } catch {
        if (request === latestRequest.current) setError(planBuilderCopy[getActiveLanguage()].exercisesLoadError);
      } finally {
        if (request === latestRequest.current) setIsLoading(false);
      }
    },
    [debouncedSearch, pattern, difficulty, traineeId],
  );

  // A new search or filter starts again from the first page.
  useEffect(() => {
    void load(1);
  }, [load]);

  function add(family: ExerciseFamilySummary) {
    const variant = defaultVariant(family);
    if (variant) onAdd(variantFacts(family, variant));
  }

  return (
    <aside className="exercise-library" aria-label={copy.library}>
      <h2 className="library-title">{copy.library}</h2>
      <input
        className="library-search"
        type="search"
        dir="auto"
        placeholder={copy.searchExercises}
        aria-label={copy.searchExercises}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="library-filters">
        <select className="library-filter" aria-label={copy.pattern} value={pattern} onChange={(event) => setPattern(event.target.value as PatternId | '')}>
          <option value="">{copy.patternAny}</option>
          {PATTERN_FILTERS.map((option) => (
            <option key={option} value={option}>
              {patternLabel(option, language)}
            </option>
          ))}
        </select>
        <select className="library-filter" aria-label={copy.level} value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty | '')}>
          <option value="">{copy.levelAny}</option>
          {DIFFICULTY_FILTERS.map((option) => (
            <option key={option} value={option}>
              {shared.training.levels[option]}
            </option>
          ))}
        </select>
      </div>

      <p className="library-target">
        {targetTitle !== undefined ? fill(copy.addingTo, { title: targetTitle || copy.untitledWorkout }) : copy.addWorkoutFirst}
      </p>

      {error && (
        <p className="library-message" role="alert">
          {error} <Button size="sm" onClick={() => load(1)}>{shared.common.retry}</Button>
        </p>
      )}
      {!error && !isLoading && items.length === 0 && <p className="library-message">{copy.noExercises}</p>}

      <ul className="library-results">
        {items.map((family) => (
          <li key={family.id} className="library-item">
            <div className="library-item-text">
              <span className="library-item-name" dir="auto">{family.name}</span>
              <span className="library-item-facts">
                {[...family.patterns.map((id) => patternLabel(id, language)), formatPlural(language, copy.variantsCount, family.variants.length)].join(' · ')}
              </span>
              <span className="library-item-facts">
                {family.variants.map((variant) => (
                  <span key={variant.exerciseId} className={variant.allowed === false ? 'library-variant-off' : undefined}>
                    {variantLabel(variant.variant, language)}{' '}
                  </span>
                ))}
              </span>
            </div>
            <Button
              size="sm"
              aria-label={fill(copy.addNamed, { name: family.name })}
              disabled={targetTitle === undefined || family.variants.length === 0}
              onClick={() => add(family)}
            >
              {copy.add}
            </Button>
          </li>
        ))}
      </ul>

      {isLoading && <p className="library-message">{shared.common.loading}</p>}
      {!isLoading && items.length < total && (
        <Button size="sm" onClick={() => load(page + 1)}>
          {fill(copy.loadMore, { shown: items.length, total })}
        </Button>
      )}
    </aside>
  );
}
