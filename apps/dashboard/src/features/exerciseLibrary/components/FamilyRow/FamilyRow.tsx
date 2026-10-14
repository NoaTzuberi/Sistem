import type { Ref } from 'react';
import type { ExerciseFamilySummary } from '@sistem/types';
import { formatPlural, humanizeId, patternLabel, reviewReasonLabel, useCopy, useLanguage } from '@sistem/shared';
import { needsReview } from '../../data/familyReview';
import { patternGroupClass } from '../../data/patternGroups';
import { exerciseLibraryCopy } from '../../copy';
import { FamilyTile } from '../FamilyTile/FamilyTile';
import './FamilyRow.css';

interface FamilyRowProps {
  family: ExerciseFamilySummary;
  isSelected: boolean;
  rowRef?: Ref<HTMLButtonElement>;
  onSelect: () => void;
}

/** One family: its tile, name, pattern (in its color) · muscle, its open issue, and its variant count. */
export function FamilyRow({ family, isSelected, rowRef, onSelect }: FamilyRowProps) {
  const language = useLanguage();
  const copy = useCopy(exerciseLibraryCopy);
  const pattern = family.patterns[0];
  const open = needsReview(family);
  // The issue that matters most, as one flag: copies (amber), an unclear pattern (grey), else the reason itself.
  const flag = !open
    ? null
    : family.reviewReasons.includes('many_copies')
      ? { tone: 'warning', text: copy.flagDuplicates }
      : family.reviewReasons.includes('unclear_pattern')
        ? { tone: 'quiet', text: copy.filters.unclear }
        : { tone: 'quiet', text: reviewReasonLabel(family.reviewReasons[0], language) };

  return (
    <li>
      <button
        ref={rowRef}
        className={`family-row ${patternGroupClass(pattern)}`}
        type="button"
        aria-current={isSelected ? 'true' : undefined}
        onClick={onSelect}
      >
        <FamilyTile name={family.name} pattern={pattern} />
        <span className="family-row-text">
          {/* Exercise names are English: their own direction, inside the Hebrew page. */}
          <bdi className="family-row-name">{family.name}</bdi>
          <span className="family-row-meta">
            <span className="family-row-pattern">{pattern ? patternLabel(pattern, language) : copy.noPattern}</span>
            {family.muscles.length > 0 && (
              <>
                {' · '}
                <bdi>{family.muscles.map(humanizeId).join(', ')}</bdi>
              </>
            )}
          </span>
        </span>
        <span className="family-row-side">
          {flag && <span className={`family-row-flag family-row-flag-${flag.tone}`}>{flag.text}</span>}
          <span className="family-row-count">{formatPlural(language, copy.variantCount, family.variants.length)}</span>
        </span>
      </button>
    </li>
  );
}
