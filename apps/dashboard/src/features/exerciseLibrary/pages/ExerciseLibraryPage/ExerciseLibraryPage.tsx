import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFamilySearchParams, ExerciseFamilySummary, PatternId } from '@sistem/types';
import { fill, formatPlural, getActiveLanguage, humanizeId, patternLabel, reviewReasonLabel, useCopy, useLanguage } from '@sistem/shared';
import { searchExerciseFamilies } from '../../../../services/coach/coachService';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { PATTERN_FILTERS } from '../../../planBuilder/data/exerciseFilters';
import { FamilyDetail } from '../../components/FamilyDetail/FamilyDetail';
import { exerciseLibraryCopy } from '../../copy';
import './ExerciseLibraryPage.css';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 40;
const FILTERS = ['needed', 'unclear', 'reviewed', 'all'] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Phase 12b: the coach reviews the library by family — the review list (unclear patterns, names
 * that matched across patterns, many copies of one variant), patterns, the main exercise of each
 * variant, merge and split. Her changes are never overwritten by re-running the grouping.
 */
export function ExerciseLibraryPage() {
  const language = useLanguage();
  const copy = useCopy(exerciseLibraryCopy);
  const [filter, setFilter] = useState<Filter>('needed');
  const [pattern, setPattern] = useState<PatternId | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<ExerciseFamilySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const latest = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (nextPage: number) => {
      const request = ++latest.current;
      setIsLoading(true);
      const params: ExerciseFamilySearchParams = {
        search: debouncedSearch || undefined,
        patterns: pattern || undefined,
        review: filter === 'all' ? undefined : filter,
        page: nextPage,
        limit: PAGE_SIZE,
      };
      try {
        const result = await searchExerciseFamilies(params);
        if (request !== latest.current) return;
        setItems((current) => (nextPage === 1 ? result.items : [...current, ...result.items]));
        setTotal(result.total);
        setPage(nextPage);
        setError(undefined);
      } catch {
        if (request === latest.current) setError(exerciseLibraryCopy[getActiveLanguage()].loadError);
      } finally {
        if (request === latest.current) setIsLoading(false);
      }
    },
    [debouncedSearch, pattern, filter],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="exercise-library-page">
      <h1 className="exercise-library-title">{copy.title}</h1>
      <p className="exercise-library-intro">{copy.intro}</p>

      <div className="exercise-library-layout">
        <section className="exercise-library-list">
          <div className="exercise-library-filters" role="group" aria-label={copy.filterLabel}>
            {FILTERS.map((option) => (
              <button key={option} type="button" className="exercise-library-filter" aria-pressed={filter === option} onClick={() => setFilter(option)}>
                {copy.filters[option]}
              </button>
            ))}
          </div>
          <div className="exercise-library-controls">
            <input
              className="exercise-library-input"
              type="search"
              dir="auto"
              placeholder={copy.search}
              aria-label={copy.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="exercise-library-input" aria-label={copy.pattern} value={pattern} onChange={(event) => setPattern(event.target.value as PatternId | '')}>
              <option value="">{copy.patternAny}</option>
              {PATTERN_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {patternLabel(option, language)}
                </option>
              ))}
            </select>
          </div>

          <p className="exercise-library-muted">{formatPlural(language, copy.families, total)}</p>
          {error && (
            <p className="exercise-library-error" role="alert">
              {error}
            </p>
          )}
          {!error && !isLoading && items.length === 0 && <p className="exercise-library-muted">{copy.empty}</p>}

          <ul className="exercise-library-rows">
            {items.map((family) => (
              <li key={family.id}>
                <button
                  type="button"
                  className="exercise-library-row"
                  aria-current={family.id === selectedId ? 'true' : undefined}
                  onClick={() => setSelectedId(family.id)}
                >
                  <bdi className="exercise-library-row-name">{family.name}</bdi>
                  <span className="exercise-library-muted">
                    {[
                      family.patterns.map((id) => patternLabel(id, language)).join(', ') || '—',
                      family.muscles.map(humanizeId).join(', '),
                      family.copyCount > 0 ? formatPlural(language, copy.copies, family.copyCount) : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {family.reviewReasons.length > 0 && !family.reviewedAt && (
                    <span className="exercise-library-badges">
                      {family.reviewReasons.map((reason) => (
                        <Badge key={reason} tone="alert">
                          {reviewReasonLabel(reason, language)}
                        </Badge>
                      ))}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {!isLoading && items.length < total && (
            <Button size="sm" onClick={() => void load(page + 1)}>
              {fill(copy.loadMore, { shown: items.length, total })}
            </Button>
          )}
        </section>

        <section className="exercise-library-detail">
          {selectedId ? (
            <FamilyDetail
              key={selectedId}
              familyId={selectedId}
              onChanged={(next) => {
                // A split / merge may have moved the selection; the list reloads either way.
                if (next) setSelectedId(next);
                void load(1);
              }}
            />
          ) : (
            <p className="exercise-library-muted">{copy.select}</p>
          )}
        </section>
      </div>
    </div>
  );
}
