import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseFamilyDetail } from '@sistem/types';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';
import { FamilyDetail } from '../../components/FamilyDetail/FamilyDetail';
import { FamilyList } from '../../components/FamilyList/FamilyList';
import { FamilySheet } from '../../components/FamilySheet/FamilySheet';
import { LibraryFilters } from '../../components/LibraryFilters/LibraryFilters';
import { LibraryHeader } from '../../components/LibraryHeader/LibraryHeader';
import { useFamilyList } from '../../hooks/useFamilyList';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
import './ExerciseLibraryPage.css';

/** = the page's narrow breakpoint in ExerciseLibraryPage.css: the detail becomes a sheet. */
const SHEET_QUERY = '(max-width: 1000px)';

/**
 * Phase 12b, redesigned: the coach reviews the library by family. The list (search, review
 * status, movement pattern) on one side, the chosen family on the other — its issue and fix,
 * its exercises and which one the builder offers. Her changes are never overwritten by
 * re-running the grouping.
 */
export function ExerciseLibraryPage() {
  const filters = useLibraryFilters();
  const list = useFamilyList({ status: filters.status, pattern: filters.pattern, search: filters.debouncedSearch });
  const isNarrow = useMediaQuery(SHEET_QUERY);
  const [selectedId, setSelectedId] = useState<string>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const selectedRowRef = useRef<HTMLButtonElement>(null);

  // New filters start a new selection. A family that just left the list because of the coach's own
  // change (marked reviewed on the "to review" tab) stays open — she sees the result.
  useEffect(() => {
    setSelectedId(undefined);
  }, [filters.status, filters.pattern, filters.debouncedSearch]);

  // Desktop: the first family of the current filters is open.
  useEffect(() => {
    if (!isNarrow && !selectedId && list.items.length > 0) setSelectedId(list.items[0].id);
  }, [isNarrow, list.items, selectedId]);

  function handleSelect(familyId: string) {
    setSelectedId(familyId);
    if (isNarrow) setIsSheetOpen(true);
  }

  // The sheet: the focus goes to its title once the family is in (FamilyDetail), back to the row on close.
  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    selectedRowRef.current?.focus();
  }, []);

  const handleChanged = useCallback(
    (family: ExerciseFamilyDetail, next?: string) => {
      list.patchFamily(family);
      // A split / merge moves exercises between families: the list and its numbers are read again.
      if (next) setSelectedId(next);
      list.reload();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- patchFamily / reload are stable
    [],
  );

  const detail = selectedId && <FamilyDetail key={selectedId} familyId={selectedId} focusTitle={isNarrow && isSheetOpen} onChanged={handleChanged} />;

  return (
    <div className="library-page">
      <LibraryHeader families={list.summary.families} toReview={list.summary.toReview} />
      <div className="library-layout">
        <div className="library-column">
          <LibraryFilters
            search={filters.search}
            onSearch={filters.setSearch}
            status={filters.status}
            statusCounts={list.tabCounts}
            onStatus={filters.setStatus}
            pattern={filters.pattern}
            onPattern={filters.setPattern}
            hasNarrowing={filters.hasNarrowing}
            onClear={filters.clear}
          />
          <FamilyList
            items={list.items}
            total={list.total}
            isLoading={list.isLoading}
            error={list.error}
            hasMore={list.hasMore}
            selectedId={selectedId}
            selectedRowRef={selectedRowRef}
            onSelect={handleSelect}
            onLoadMore={list.loadMore}
          />
        </div>
        {!isNarrow && <div className="library-detail">{detail}</div>}
      </div>
      {isNarrow && (
        <FamilySheet isOpen={isSheetOpen} onClose={closeSheet}>
          {detail}
        </FamilySheet>
      )}
    </div>
  );
}
