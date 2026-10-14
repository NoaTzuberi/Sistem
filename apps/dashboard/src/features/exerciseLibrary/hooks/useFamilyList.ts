import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFamilySummary, PatternId } from '@sistem/types';
import { getActiveLanguage } from '@sistem/shared';
import { searchExerciseFamilies } from '../../../services/coach/coachService';
import { REVIEW_STATUSES } from '../data/familyReview';
import type { ReviewStatus } from '../data/familyReview';
import { exerciseLibraryCopy } from '../copy';

/** A page at a time ("more" adds the next): the library has thousands of families. */
const PAGE_SIZE = 40;

interface ListFilters {
  status: ReviewStatus;
  pattern: PatternId | '';
  search: string;
}

const reviewParam = (status: ReviewStatus) => (status === 'all' ? undefined : status);

/**
 * The family list for the current filters, plus the numbers around it: how many families each
 * status tab holds for this search / pattern, and the library's totals for the header. Every
 * number is a `total` the server returns — nothing is counted here.
 */
export function useFamilyList({ status, pattern, search }: ListFilters) {
  const [items, setItems] = useState<ExerciseFamilySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [tabCounts, setTabCounts] = useState<Partial<Record<ReviewStatus, number>>>({});
  const [summary, setSummary] = useState<{ families?: number; toReview?: number }>({});
  const latest = useRef(0);
  const [reloadTick, setReloadTick] = useState(0);

  const load = useCallback(
    async (nextPage: number) => {
      const request = ++latest.current;
      setIsLoading(true);
      try {
        const result = await searchExerciseFamilies({ search: search || undefined, patterns: pattern || undefined, review: reviewParam(status), page: nextPage, limit: PAGE_SIZE });
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
    [search, pattern, status],
  );

  useEffect(() => {
    void load(1);
  }, [load, reloadTick]);

  // The count on each status tab, for the same search and pattern (one tiny request each).
  useEffect(() => {
    let isCurrent = true;
    void Promise.all(
      REVIEW_STATUSES.map((entry) =>
        searchExerciseFamilies({ search: search || undefined, patterns: pattern || undefined, review: reviewParam(entry), limit: 1 })
          .then((result) => [entry, result.total] as const)
          .catch(() => [entry, undefined] as const),
      ),
    ).then((counts) => {
      if (isCurrent) setTabCounts(Object.fromEntries(counts.filter(([, count]) => count !== undefined)));
    });
    return () => {
      isCurrent = false;
    };
  }, [search, pattern, reloadTick]);

  // The header's totals: the whole library, whatever the filters.
  useEffect(() => {
    let isCurrent = true;
    void Promise.all([searchExerciseFamilies({ limit: 1 }), searchExerciseFamilies({ review: 'needed', limit: 1 })])
      .then(([all, needed]) => isCurrent && setSummary({ families: all.total, toReview: needed.total }))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [reloadTick]);

  /** A family changed (reviewed, patterns, merge…): its row is patched at once, the numbers re-read. */
  const patchFamily = useCallback((family: ExerciseFamilySummary) => {
    setItems((current) => current.map((entry) => (entry.id === family.id ? { ...entry, ...family } : entry)));
  }, []);

  return {
    items,
    total,
    isLoading,
    error,
    hasMore: !isLoading && items.length < total,
    loadMore: () => void load(page + 1),
    tabCounts,
    summary,
    patchFamily,
    reload: () => setReloadTick((tick) => tick + 1),
  };
}
