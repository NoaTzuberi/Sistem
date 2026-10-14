import { useState } from 'react';
import type { ExerciseFamilyDetail, PatternId } from '@sistem/types';
import { fill, patternLabel, reviewReasonLabel, useCopy, useLanguage, variantLabel } from '@sistem/shared';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { PATTERN_FILTERS } from '../../../planBuilder/data/exerciseFilters';
import { mostCopiedVariant, needsReview } from '../../data/familyReview';
import { patternGroupClass } from '../../data/patternGroups';
import type { FamilyReview } from '../../hooks/useFamilyReview';
import { exerciseLibraryCopy } from '../../copy';
import './IssuePanel.css';

interface IssuePanelProps {
  family: ExerciseFamilyDetail;
  review: FamilyReview;
}

/**
 * Why a family is on the review list, and the fix. An unclear pattern: pick the pattern(s), save
 * and mark reviewed in one go. Many copies of a variant: say which, and mark it reviewed (they are
 * kept on purpose). Any other reason: its name and "mark reviewed". After a save, a pink note.
 */
export function IssuePanel({ family, review }: IssuePanelProps) {
  const language = useLanguage();
  const copy = useCopy(exerciseLibraryCopy);
  const [picked, setPicked] = useState<PatternId[]>([]);

  if (review.justReviewed && family.reviewedAt) {
    return (
      <p className="issue-done" role="status">
        <span aria-hidden="true">✓</span> {copy.reviewedNote}
      </p>
    );
  }
  if (!needsReview(family)) return null;

  if (family.reviewReasons.includes('unclear_pattern')) {
    const toggle = (pattern: PatternId) => setPicked((current) => (current.includes(pattern) ? current.filter((id) => id !== pattern) : [...current, pattern]));
    return (
      <section className="issue issue-quiet">
        <h3 className="issue-title">{copy.unclearTitle}</h3>
        <p className="issue-text">{copy.unclearBody}</p>
        <div className="issue-patterns" role="group" aria-label={copy.patterns}>
          {PATTERN_FILTERS.map((pattern) => (
            <button key={pattern} className={`issue-pattern ${patternGroupClass(pattern)}`} type="button" aria-pressed={picked.includes(pattern)} onClick={() => toggle(pattern)}>
              <span className="issue-pattern-dot" aria-hidden="true" />
              {patternLabel(pattern, language)}
            </button>
          ))}
        </div>
        <div className="issue-actions">
          <PillButton variant="primary" disabled={picked.length === 0 || review.isBusy} onClick={() => void review.savePatternsAndReview(picked)}>
            {copy.saveAndReview}
          </PillButton>
        </div>
      </section>
    );
  }

  if (family.reviewReasons.includes('many_copies')) {
    const copied = mostCopiedVariant(family);
    return (
      <section className="issue issue-warning">
        <h3 className="issue-title">{reviewReasonLabel('many_copies', language)}</h3>
        {copied && <p className="issue-text">{fill(copy.duplicatesBody, { variant: variantLabel(copied.variant, language), count: copied.count })}</p>}
        <div className="issue-actions">
          <PillButton variant="soft" disabled={review.isBusy} onClick={() => void review.markReviewed()}>
            {copy.looksFine}
          </PillButton>
        </div>
      </section>
    );
  }

  return (
    <section className="issue issue-quiet">
      <h3 className="issue-title">{family.reviewReasons.map((reason) => reviewReasonLabel(reason, language)).join(' · ')}</h3>
      <div className="issue-actions">
        <PillButton variant="soft" disabled={review.isBusy} onClick={() => void review.markReviewed()}>
          {copy.markReviewed}
        </PillButton>
      </div>
    </section>
  );
}
