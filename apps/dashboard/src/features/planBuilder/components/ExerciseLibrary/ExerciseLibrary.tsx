import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFacts } from '@sistem/types';
import { searchExercises } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { humanizeId } from '../../../../utils/format';
import { DIFFICULTY_FILTERS, EQUIPMENT_FILTERS, MUSCLE_FILTERS } from '../../data/exerciseFilters';
import './ExerciseLibrary.css';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

interface ExerciseLibraryProps {
  /** Title of the workout "Add" adds to; undefined while the plan has no workout. */
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
  return (
    <select className="library-filter" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}: any</option>
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
        if (request === latestRequest.current) setError("Couldn't load exercises.");
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
    <aside className="exercise-library" aria-label="Exercise library">
      <h2 className="library-title">Exercise library</h2>
      <input
        className="library-search"
        type="search"
        placeholder="Search exercises"
        aria-label="Search exercises"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="library-filters">
        <FilterSelect label="Muscle" value={muscle} options={MUSCLE_FILTERS} onChange={setMuscle} />
        <FilterSelect label="Equipment" value={equipment} options={EQUIPMENT_FILTERS} onChange={setEquipment} />
        <FilterSelect label="Level" value={difficulty} options={DIFFICULTY_FILTERS} onChange={setDifficulty} />
      </div>

      <p className="library-target">
        {targetTitle !== undefined ? `Adding to: ${targetTitle || 'untitled workout'}` : 'Add a workout first, then add exercises to it.'}
      </p>

      {error && (
        <p className="library-message" role="alert">
          {error} <Button size="sm" onClick={() => load(1)}>Try again</Button>
        </p>
      )}
      {!error && !isLoading && items.length === 0 && <p className="library-message">No exercises found.</p>}

      <ul className="library-results">
        {items.map((exercise) => (
          <li key={exercise.id} className="library-item">
            <div className="library-item-text">
              <span className="library-item-name">{exercise.name}</span>
              <span className="library-item-facts">
                {[...exercise.primaryMuscles, ...exercise.equipment, exercise.difficulty].map(humanizeId).join(' · ')}
              </span>
            </div>
            <Button
              size="sm"
              aria-label={`Add ${exercise.name}`}
              disabled={targetTitle === undefined}
              onClick={() => onAdd(exercise)}
            >
              Add
            </Button>
          </li>
        ))}
      </ul>

      {isLoading && <p className="library-message">Loading…</p>}
      {!isLoading && items.length < total && (
        <Button size="sm" onClick={() => load(page + 1)}>
          Load more ({items.length} of {total})
        </Button>
      )}
    </aside>
  );
}
