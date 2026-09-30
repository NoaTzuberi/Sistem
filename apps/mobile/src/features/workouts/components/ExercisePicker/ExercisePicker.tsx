import { useEffect, useState } from 'react';
import { Input } from '../../../../components/common/Input/Input';
import { Button } from '../../../../components/common/Button/Button';
import { ExerciseMedia } from '../../../exercises/components/ExerciseMedia/ExerciseMedia';
import { WorkoutChip } from '../WorkoutChip/WorkoutChip';
import { listExercises } from '../../../../services/exercises/exercisesService';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { muscleLabel, muscleTagHue } from '../../../exercises/data/filterOptions';
import { EXERCISE_CATEGORY_OPTIONS } from './exerciseCategoryOptions';
import type { PublicExercise, Category } from '../../../exercises/types';
import './ExercisePicker.css';

const SEARCH_DEBOUNCE_MS = 350;
const BROWSE_LIMIT = 24;

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12L10 18L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PickerExerciseCardProps {
  exercise: PublicExercise;
  isAdded: boolean;
  onToggle: () => void;
}

function PickerExerciseCard({ exercise, isAdded, onToggle }: PickerExerciseCardProps) {
  return (
    <button
      type="button"
      className={'picker-exercise-card' + (isAdded ? ' picker-exercise-card-added' : '')}
      onClick={onToggle}
      aria-pressed={isAdded}
    >
      <div className="picker-exercise-card-media">
        <ExerciseMedia media={exercise.media} alt={exercise.name} variant="card" />
        {isAdded && (
          <span className="picker-exercise-card-check">
            <CheckIcon />
          </span>
        )}
      </div>
      <span className="picker-exercise-card-name">{exercise.name}</span>
    </button>
  );
}

interface ExercisePickerProps {
  addedExerciseIds: Set<string>;
  onAdd: (exercise: PublicExercise) => void;
  onToggle: (exercise: PublicExercise) => void;
}

export function ExercisePicker({ addedExerciseIds, onAdd, onToggle }: ExercisePickerProps) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [results, setResults] = useState<PublicExercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [activeCategory, setActiveCategory] = useState<Category | undefined>(undefined);
  const [browseResults, setBrowseResults] = useState<PublicExercise[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(true);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;

    async function search() {
      setIsSearching(true);
      try {
        const data = await listExercises({ search: debouncedSearch, limit: 8 });
        if (!cancelled) {
          setResults(data.items);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    async function browse() {
      setIsBrowsing(true);
      try {
        const data = await listExercises({ category: activeCategory, limit: BROWSE_LIMIT });
        if (!cancelled) {
          setBrowseResults(data.items);
        }
      } finally {
        if (!cancelled) {
          setIsBrowsing(false);
        }
      }
    }

    browse();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="exercise-picker">
      <div className="exercise-picker-search">
        <svg className="exercise-picker-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13.75 13.75L17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <Input
          className="exercise-picker-search-input"
          placeholder="Search exercises to add..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Search exercises to add"
        />
      </div>

      {isSearching && <p className="text-caption exercise-picker-status">Searching...</p>}

      {!isSearching && debouncedSearch.trim() && results.length === 0 && (
        <p className="text-caption exercise-picker-status">No exercises match that search.</p>
      )}

      {results.length > 0 && (
        <ul className="exercise-picker-results">
          {results.map((exercise) => {
            const alreadyAdded = addedExerciseIds.has(exercise.id);
            const primaryMuscle = exercise.primaryMuscles[0];
            return (
              <li key={exercise.id} className="exercise-picker-result">
                <div className="exercise-picker-result-media">
                  <ExerciseMedia media={exercise.media} alt={exercise.name} variant="card" />
                </div>
                <div className="exercise-picker-result-info">
                  <span className="exercise-picker-result-name">{exercise.name}</span>
                  {primaryMuscle && (
                    <span
                      className={`exercise-picker-result-tag exercise-picker-result-tag-${muscleTagHue(primaryMuscle)}`}
                    >
                      {muscleLabel(primaryMuscle)}
                    </span>
                  )}
                </div>
                <Button
                  className="exercise-picker-result-add"
                  variant="ghost"
                  onClick={() => onAdd(exercise)}
                  disabled={alreadyAdded}
                >
                  {alreadyAdded ? 'Added' : 'Add'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="exercise-picker-browse">
        <span className="exercise-picker-browse-label">Or browse by category</span>
        <div className="exercise-picker-browse-chips">
          <WorkoutChip label="All" selected={activeCategory === undefined} onClick={() => setActiveCategory(undefined)} />
          {EXERCISE_CATEGORY_OPTIONS.map((option) => (
            <WorkoutChip
              key={option.value}
              label={option.label}
              icon={<option.Icon />}
              selected={activeCategory === option.value}
              onClick={() => setActiveCategory(activeCategory === option.value ? undefined : option.value)}
            />
          ))}
        </div>

        {isBrowsing && <p className="text-caption exercise-picker-status">Loading exercises...</p>}

        {!isBrowsing && browseResults.length === 0 && (
          <p className="text-caption exercise-picker-status">No exercises in this category yet.</p>
        )}

        {!isBrowsing && browseResults.length > 0 && (
          <div className="exercise-picker-grid">
            {browseResults.map((exercise) => (
              <PickerExerciseCard
                key={exercise.id}
                exercise={exercise}
                isAdded={addedExerciseIds.has(exercise.id)}
                onToggle={() => onToggle(exercise)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
