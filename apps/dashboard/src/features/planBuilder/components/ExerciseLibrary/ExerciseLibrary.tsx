import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFacts } from '@sistem/types';
import { searchExercises } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { fill, getActiveLanguage, humanizeId, sharedCopy, useCopy } from '@sistem/shared';
import { DIFFICULTY_FILTERS, EQUIPMENT_FILTERS, MUSCLE_FILTERS } from '../../data/exerciseFilters';
import './ExerciseLibrary.css';
import { planBuilderCopy } from '../../copy';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

interface ExerciseLibraryProps {
  /** Title of the workout copy.add adds to; undefined while the plan has no workout. */
  targetTitle: string | undefined;
  onAdd: (exercise: ExerciseFacts) => void;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const copy = useCopy(planBuilderCopy);
  return (
    <select className="library-filter" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{fill(copy.filterAny, { label })}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {humanizeId(option)}
        </option>
      ))}
    </select>
  );
}

/** Search over the coach's library: every imported exercise, factual fields only. */
export function ExerciseLibrary({ targetTitle, onAdd }: ExerciseLibraryProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [items, setItems] = useState<ExerciseFacts[]>([]);
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
        const result = await searchExercises({
          search: debouncedSearch || undefined,
          muscle: muscle || undefined,
          equipment: equipment || undefined,
          difficulty: difficulty || undefined,
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
    [debouncedSearch, muscle, equipment, difficulty],
  );

  // A new search or filter starts again from the first page.
  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <aside className="exercise-library" aria-label={copy.library}>
      <h2 className="library-title">{copy.library}</h2>
      <input
        className="library-search"
        type="search"
        placeholder={copy.searchExercises}
        aria-label={copy.searchExercises}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="library-filters">
        <FilterSelect label={copy.muscle} value={muscle} options={MUSCLE_FILTERS} onChange={setMuscle} />
        <FilterSelect label={copy.equipment} value={equipment} options={EQUIPMENT_FILTERS} onChange={setEquipment} />
        <FilterSelect label={copy.level} value={difficulty} options={DIFFICULTY_FILTERS} onChange={setDifficulty} />
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
        {items.map((exercise) => (
          <li key={exercise.id} className="library-item">
            <div className="library-item-text">
              <span className="library-item-name" dir="auto">{exercise.name}</span>
              <span className="library-item-facts">
                {[...exercise.primaryMuscles, ...exercise.equipment, exercise.difficulty].map(humanizeId).join(' · ')}
              </span>
            </div>
            <Button
              size="sm"
              aria-label={fill(copy.addNamed, { name: exercise.name })}
              disabled={targetTitle === undefined}
              onClick={() => onAdd(exercise)}
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
