import { useEffect, useState } from 'react';
import { Input } from '../../../../components/common/Input/Input';
import { Select } from '../../../../components/common/Select/Select';
import { Button } from '../../../../components/common/Button/Button';
import { FilterChip } from '../FilterChip/FilterChip';
import {
  MUSCLE_OPTIONS,
  EQUIPMENT_OPTIONS,
  DIFFICULTY_OPTIONS,
  MOVEMENT_TYPE_OPTIONS,
  difficultyIcon,
  movementTypeIcon,
} from '../../data/filterOptions';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import type { ExerciseFilterState } from '../../types';
import './ExerciseFilters.css';

const SEARCH_DEBOUNCE_MS = 350;

interface ExerciseFiltersProps {
  filters: ExerciseFilterState;
  onChange: (patch: Partial<ExerciseFilterState>) => void;
  onClear: () => void;
}

export function ExerciseFilters({ filters, onChange, onClear }: ExerciseFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch });
    }
    // Only re-run when the debounced value itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const hasActiveFilters = Boolean(
    filters.search || filters.muscle || filters.equipment || filters.difficulty || filters.movementType,
  );

  return (
    <div className="exercise-filters">
      <div className="exercise-search">
        <svg className="exercise-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13.75 13.75L17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <Input
          className="exercise-search-input"
          placeholder="Search exercises..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Search exercises"
        />
        {searchInput && (
          <button
            type="button"
            className="exercise-search-clear"
            onClick={() => setSearchInput('')}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.16" />
              <path
                d="M7.25 7.25L12.75 12.75M12.75 7.25L7.25 12.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="exercise-filters-row">
        <Select
          className="exercise-filter-select"
          placeholder="All muscles"
          value={filters.muscle ?? ''}
          onChange={(event) => onChange({ muscle: event.target.value || undefined })}
          options={MUSCLE_OPTIONS}
        />
        <Select
          className="exercise-filter-select"
          placeholder="All equipment"
          value={filters.equipment ?? ''}
          onChange={(event) => onChange({ equipment: event.target.value || undefined })}
          options={EQUIPMENT_OPTIONS}
        />
      </div>

      <div className="exercise-filters-chips">
        {DIFFICULTY_OPTIONS.map((option) => {
          const Icon = difficultyIcon(option.value);
          return (
            <FilterChip
              key={option.value}
              label={option.label}
              icon={<Icon />}
              selected={filters.difficulty === option.value}
              onClick={() =>
                onChange({ difficulty: filters.difficulty === option.value ? undefined : option.value })
              }
            />
          );
        })}
        {MOVEMENT_TYPE_OPTIONS.map((option) => {
          const Icon = movementTypeIcon(option.value);
          return (
            <FilterChip
              key={option.value}
              label={option.label}
              icon={<Icon />}
              selected={filters.movementType === option.value}
              onClick={() =>
                onChange({
                  movementType: filters.movementType === option.value ? undefined : option.value,
                })
              }
            />
          );
        })}
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
