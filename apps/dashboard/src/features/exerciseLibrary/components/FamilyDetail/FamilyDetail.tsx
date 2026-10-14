import { useEffect, useRef } from 'react';
import type { ExerciseFamilyDetail } from '@sistem/types';
import { formatPlural, humanizeId, patternLabel, sharedCopy, useCopy, useLanguage, variantLabel } from '@sistem/shared';
import { needsReview, variantSize } from '../../data/familyReview';
import { patternGroupClass } from '../../data/patternGroups';
import { useFamilyDetail } from '../../hooks/useFamilyDetail';
import { useFamilyReview } from '../../hooks/useFamilyReview';
import { exerciseLibraryCopy } from '../../copy';
import { FamilyTile } from '../FamilyTile/FamilyTile';
import { FamilyTools } from '../FamilyTools/FamilyTools';
import { IssuePanel } from '../IssuePanel/IssuePanel';
import { VariantCard } from '../VariantCard/VariantCard';
import './FamilyDetail.css';

interface FamilyDetailProps {
  familyId: string;
  /** In the phone sheet: the title takes the focus once the family has loaded. */
  focusTitle?: boolean;
  /** The server accepted a change; `next` = select that family instead (after a split). */
  onChanged: (family: ExerciseFamilyDetail, next?: string) => void;
}

/** One family: who it is (hero), what needs reviewing and its fix, its exercises, and what the builder will offer. */
export function FamilyDetail({ familyId, focusTitle = false, onChanged }: FamilyDetailProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(exerciseLibraryCopy);
  const { family, setFamily, error, isLoading } = useFamilyDetail(familyId);
  const review = useFamilyReview({ family, setFamily, onChanged });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasFamily = family !== undefined;

  useEffect(() => {
    if (focusTitle && hasFamily) titleRef.current?.focus();
  }, [focusTitle, hasFamily]);

  if (isLoading) return <p className="family-detail-message">{shared.common.loading}</p>;
  if (error || !family) return <p className="family-detail-message family-detail-error">{error}</p>;

  const pattern = family.patterns[0];
  const isOpen = needsReview(family);
  const mains = family.members.filter((member) => member.isPrimary);

  return (
    <article className={`family-detail ${patternGroupClass(pattern)}`}>
      <header className="family-detail-hero">
        <FamilyTile name={family.name} pattern={pattern} size="lg" />
        <div className="family-detail-heading">
          <h2 className="family-detail-name" ref={titleRef} tabIndex={-1}>
            <bdi>{family.name}</bdi>
          </h2>
          <ul className="family-detail-chips">
            {family.patterns.length > 0 ? (
              family.patterns.map((id) => (
                <li key={id} className={`family-detail-chip family-detail-chip-pattern ${patternGroupClass(id)}`}>
                  {patternLabel(id, language)}
                </li>
              ))
            ) : (
              <li className="family-detail-chip family-detail-chip-none">{copy.noPattern}</li>
            )}
            {family.muscles.length > 0 && (
              <li className="family-detail-chip">
                <bdi>{family.muscles.map(humanizeId).join(', ')}</bdi>
              </li>
            )}
            <li className="family-detail-chip">{formatPlural(language, copy.variantCount, family.variants.length)}</li>
          </ul>
        </div>
        {isOpen && <span className="family-detail-status family-detail-status-open">{copy.filters.needed}</span>}
        {family.reviewedAt && <span className="family-detail-status family-detail-status-done">✓ {copy.reviewedTag}</span>}
      </header>

      <div className="family-detail-body">
        <IssuePanel family={family} review={review} />
        {review.error && (
          <p className="family-detail-error" role="alert">
            {review.error}
          </p>
        )}

        <section>
          <div className="family-detail-section-head">
            <h3 className="family-detail-section-title">{copy.variantsTitle}</h3>
            <span className="family-detail-hint">{copy.variantsHint}</span>
          </div>
          <ul className="family-detail-variants">
            {family.members.map((member) => (
              <VariantCard
                key={member.exerciseId}
                member={member}
                variantSize={variantSize(family, member.variant)}
                isBusy={review.isBusy}
                onMakeMain={() => void review.makeMain(member.exerciseId)}
              />
            ))}
          </ul>
        </section>

        {mains.length > 0 && (
          <p className="family-detail-offered">
            <span>{copy.offeredNote}</span>
            {mains.map((member, index) => (
              <span key={member.exerciseId} className="family-detail-offered-item">
                {index > 0 && ' · '}
                <bdi className="family-detail-offered-name">{member.name}</bdi> ({variantLabel(member.variant, language)})
              </span>
            ))}
          </p>
        )}

        <FamilyTools family={family} review={review} />
      </div>
    </article>
  );
}
