import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFamilySummary, PatternId } from '@sistem/types';
import { getActiveLanguage } from '@sistem/shared';
import { searchExerciseFamilies } from '../../../services/coach/coachService';
import type { DIFFICULTY_FILTERS } from '../data/exerciseFilters';
import { planBuilderCopy } from '../copy';

export type LibraryDifficulty = (typeof DIFFICULTY_FILTERS)[number];

/** The slot the library was opened for: only the families that fit it are listed. */
export interface LibrarySlotFilter {
  workoutType: string;
  slotId: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/**
 * The library sheet's list: the coach's exercise families by search, movement pattern and level,
 * a page at a time. Opened for a slot, it starts on that slot's families with her equipment only
 * (both can be switched off), and offers the families the coach used there most recently.
 * Variants the trainee's equipment rules out come marked, never hidden.
 */
export function useExerciseLibrary(traineeId: string, slot?: LibrarySlotFilter) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pattern, setPattern] = useState<PatternId | ''>('');
  const [difficulty, setDifficulty] = useState<LibraryDifficulty | ''>('');
  const [equipmentOnly, setEquipmentOnly] = useState(slot !== undefined);
  const [showAll, setShowAll] = useState(false);
  const [items, setItems] = useState<ExerciseFamilySummary[]>([]);
  const [recent, setRecent] = useState<ExerciseFamilySummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  // Only the newest request may write its answer.
  const latestRequest = useRef(0);
  const slotFilter = slot && !showAll ? slot : undefined;
  const workoutType = slotFilter?.workoutType;
  const slotId = slotFilter?.slotId;

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
          workoutType,
          slotId,
          equipmentOnly,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        if (request !== latestRequest.current) return;
        setItems((current) => (nextPage === 1 ? result.items : [...current, ...result.items]));
        if (nextPage === 1) setRecent(result.recent ?? []);
        setPage(nextPage);
        setTotal(result.total);
        setError(undefined);
      } catch {
        if (request === latestRequest.current) setError(planBuilderCopy[getActiveLanguage()].exercisesLoadError);
      } finally {
        if (request === latestRequest.current) setIsLoading(false);
      }
    },
    [debouncedSearch, pattern, difficulty, traineeId, workoutType, slotId, equipmentOnly],
  );

  // A new search or filter starts again from the first page.
  useEffect(() => {
    void load(1);
  }, [load]);

  return {
    search,
    setSearch,
    pattern,
    setPattern,
    difficulty,
    setDifficulty,
    equipmentOnly,
    setEquipmentOnly,
    /** Slot mode only: the slot filter is switched off ("show all exercises"). */
    showAll,
    setShowAll,
    items,
    /** Recently used families for this filter — only while nothing is typed. */
    recent: search ? [] : recent,
    total,
    isLoading,
    error,
    retry: () => void load(1),
    loadMore: () => void load(page + 1),
  };
}
