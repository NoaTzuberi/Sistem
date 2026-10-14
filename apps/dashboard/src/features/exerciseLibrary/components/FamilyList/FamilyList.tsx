import type { Ref } from 'react';
import type { ExerciseFamilySummary } from '@sistem/types';
import { fill, formatPlural, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { exerciseLibraryCopy } from '../../copy';
import { FamilyRow } from '../FamilyRow/FamilyRow';
import './FamilyList.css';

interface FamilyListProps {
  items: ExerciseFamilySummary[];
  total: number;
  isLoading: boolean;
  error: string | undefined;
  hasMore: boolean;
  selectedId: string | undefined;
  /** The selected row (focus returns to it when the phone sheet closes). */
  selectedRowRef: Ref<HTMLButtonElement>;
  onSelect: (familyId: string) => void;
  onLoadMore: () => void;
}

/** The families of the current filters, 40 at a time ("more" adds the next 40). */
export function FamilyList({ items, total, isLoading, error, hasMore, selectedId, selectedRowRef, onSelect, onLoadMore }: FamilyListProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(exerciseLibraryCopy);
  return (
    <div className="family-list">
      <p className="family-list-count">{formatPlural(language, copy.families, total)}</p>
      {error && (
        <p className="family-list-message" role="alert">
          {error}
        </p>
      )}
      {!error && !isLoading && items.length === 0 && (
        <div className="family-list-empty">
          <p className="family-list-empty-title">{copy.notFoundTitle}</p>
          <p>{copy.notFoundBody}</p>
        </div>
      )}
      <ul className="family-list-rows">
        {items.map((family) => (
          <FamilyRow
            key={family.id}
            family={family}
            isSelected={family.id === selectedId}
            rowRef={family.id === selectedId ? selectedRowRef : undefined}
            onSelect={() => onSelect(family.id)}
          />
        ))}
      </ul>
      {isLoading && <p className="family-list-message">{shared.common.loading}</p>}
      {hasMore && (
        <PillButton variant="soft" onClick={onLoadMore}>
          {fill(copy.loadMore, { shown: items.length, total })}
        </PillButton>
      )}
    </div>
  );
}
