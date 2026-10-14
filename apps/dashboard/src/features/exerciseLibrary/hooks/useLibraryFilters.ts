import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PatternId } from '@sistem/types';
import { PATTERN_FILTERS } from '../../planBuilder/data/exerciseFilters';
import { REVIEW_STATUSES } from '../data/familyReview';
import type { ReviewStatus } from '../data/familyReview';

const SEARCH_DEBOUNCE_MS = 300;
const STATUS_PARAM = 'status';
const PATTERN_PARAM = 'pattern';
const DEFAULT_STATUS: ReviewStatus = 'needed';

/**
 * The library's filters. The status tab and the pattern live in the URL (a reload or a shared
 * link keeps them); the search is typed text, debounced before it reaches the server.
 */
export function useLibraryFilters() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const statusParam = params.get(STATUS_PARAM);
  const status: ReviewStatus = (REVIEW_STATUSES as readonly string[]).includes(statusParam ?? '') ? (statusParam as ReviewStatus) : DEFAULT_STATUS;
  const patternParam = params.get(PATTERN_PARAM);
  const pattern: PatternId | '' = (PATTERN_FILTERS as readonly string[]).includes(patternParam ?? '') ? (patternParam as PatternId) : '';

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  function update(next: { status?: ReviewStatus; pattern?: PatternId | '' }) {
    const nextStatus = next.status ?? status;
    const nextPattern = next.pattern ?? pattern;
    const query: Record<string, string> = {};
    if (nextStatus !== DEFAULT_STATUS) query[STATUS_PARAM] = nextStatus;
    if (nextPattern) query[PATTERN_PARAM] = nextPattern;
    setParams(query, { replace: true });
  }

  return {
    status,
    pattern,
    search,
    debouncedSearch,
    setStatus: (next: ReviewStatus) => update({ status: next }),
    setPattern: (next: PatternId | '') => update({ pattern: next }),
    setSearch,
    /** "Clear filters" is offered while a search or a pattern narrows the list. */
    hasNarrowing: search.trim() !== '' || pattern !== '',
    clear: () => {
      setSearch('');
      setDebouncedSearch('');
      update({ pattern: '' });
    },
  };
}
