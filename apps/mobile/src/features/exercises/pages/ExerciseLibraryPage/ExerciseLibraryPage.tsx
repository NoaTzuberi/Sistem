import { useEffect, useState } from 'react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { ExerciseFilters } from '../../components/ExerciseFilters/ExerciseFilters';
import { ExerciseCard } from '../../components/ExerciseCard/ExerciseCard';
import { ExercisePagination } from '../../components/ExercisePagination/ExercisePagination';
import { ExerciseEmptyState } from '../../components/ExerciseEmptyState/ExerciseEmptyState';
import { listExercises } from '../../../../services/exercises/exercisesService';
import { INITIAL_EXERCISE_FILTER_STATE } from '../../types';
import type { ExerciseFilterState, PaginatedExercises } from '../../types';
import './ExerciseLibraryPage.css';

function hasActiveFilters(filters: ExerciseFilterState): boolean {
  return Boolean(
    filters.search || filters.muscle || filters.equipment || filters.difficulty || filters.movementType,
  );
}

export function ExerciseLibraryPage() {
  const [filters, setFilters] = useState<ExerciseFilterState>(INITIAL_EXERCISE_FILTER_STATE);
  const [page, setPage] = useState(1);
  const [filterResetCount, setFilterResetCount] = useState(0);
  const [result, setResult] = useState<PaginatedExercises | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(undefined);
      try {
        const data = await listExercises({
          page,
          muscle: filters.muscle,
          equipment: filters.equipment,
          difficulty: filters.difficulty,
          movementType: filters.movementType,
          search: filters.search || undefined,
        });
        if (!cancelled) {
          setResult(data);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Couldn't load exercises. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, filters.muscle, filters.equipment, filters.difficulty, filters.movementType, filters.search]);

  function updateFilters(patch: Partial<ExerciseFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(INITIAL_EXERCISE_FILTER_STATE);
    setPage(1);
    setFilterResetCount((count) => count + 1);
  }

  const filtersActive = hasActiveFilters(filters);

  return (
    <AppShell>
      <Section className="exercise-library-page">
        <Container>
          <div className="exercise-library-toolbar">
            <ExerciseFilters
              key={filterResetCount}
              filters={filters}
              onChange={updateFilters}
              onClear={clearFilters}
            />
          </div>

          {isLoading && (
            <div className="exercise-library-loading">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && loadError && <p className="exercise-library-error">{loadError}</p>}

          {!isLoading && !loadError && result && result.items.length === 0 && (
            <ExerciseEmptyState
              variant={filtersActive ? 'no-results' : 'no-data'}
              onClearFilters={filtersActive ? clearFilters : undefined}
            />
          )}

          {!isLoading && !loadError && result && result.items.length > 0 && (
            <>
              <div className="exercise-library-grid">
                {result.items.map((exercise, index) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
                ))}
              </div>
              <ExercisePagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
            </>
          )}
        </Container>
      </Section>
    </AppShell>
  );
}
