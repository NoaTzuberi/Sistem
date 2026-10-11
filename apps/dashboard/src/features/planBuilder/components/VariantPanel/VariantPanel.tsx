import { useCallback } from 'react';
import type { ExerciseFacts, ExerciseVariantSummary } from '@sistem/types';
import {
  describeBest,
  describePerformance,
  fill,
  formatDateShort,
  getActiveLanguage,
  sharedCopy,
  useCopy,
  useLanguage,
  useLoad,
  variantLabel,
} from '@sistem/shared';
import { getExerciseFamily, getFamilyHistory } from '../../../../services/coach/coachService';
import { variantFacts } from '../../data/familyFacts';
import { planBuilderCopy } from '../../copy';
import './VariantPanel.css';

interface VariantPanelProps {
  traineeId: string;
  /** The exercise in the row now (has a familyId). */
  facts: ExerciseFacts;
  /** Swap to another variant — keeps sets, reps, rest and notes. */
  onSwap: (facts: ExerciseFacts) => void;
}

/**
 * Phase 12b, the exercise card's variant part: the family's variants (primaries; the ones her
 * equipment / level rule out are marked), other versions of the same equipment, and her history
 * per variant — PRs and "last time" stay per variant, the others are secondary info.
 */
export function VariantPanel({ traineeId, facts, onSwap }: VariantPanelProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const familyId = facts.familyId!;
  const load = useCallback(
    () => Promise.all([getExerciseFamily(familyId, traineeId), getFamilyHistory(traineeId, familyId)]),
    [familyId, traineeId],
  );
  const { data, error, isLoading } = useLoad(load, planBuilderCopy[getActiveLanguage()].variantsLoadError);

  if (isLoading && !data) return <p className="variant-panel-muted">{shared.common.loading}</p>;
  if (error || !data) return <p className="variant-panel-muted">{error}</p>;
  const [family, history] = data;
  const copies = family.members.filter((member) => !member.isPrimary);

  function swap(variant: ExerciseVariantSummary) {
    if (variant.exerciseId !== facts.id) onSwap(variantFacts(family, variant));
  }

  return (
    <div className="variant-panel">
      <div className="variant-panel-chips" role="group" aria-label={copy.variant}>
        {family.variants.map((variant) => (
          <button
            key={variant.exerciseId}
            type="button"
            className="variant-panel-chip"
            aria-pressed={variant.exerciseId === facts.id}
            title={variant.allowed === false ? copy.variantNotForHer : undefined}
            onClick={() => swap(variant)}
          >
            {variantLabel(variant.variant, language)}
            {variant.allowed === false && <span className="variant-panel-off"> · {copy.variantNotForHer}</span>}
          </button>
        ))}
      </div>

      {copies.length > 0 && (
        <details className="variant-panel-copies">
          <summary>{copy.otherVersions}</summary>
          <ul className="variant-panel-list">
            {copies.map((member) => (
              <li key={member.exerciseId}>
                <button type="button" className="variant-panel-link" aria-pressed={member.exerciseId === facts.id} onClick={() => swap(member)}>
                  <bdi>{member.name}</bdi> · {variantLabel(member.variant, language)}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="variant-panel-heading">{copy.history}</p>
      {history.variants.length === 0 ? (
        <p className="variant-panel-muted">{copy.historyNone}</p>
      ) : (
        <ul className="variant-panel-list">
          {/* The variant in the plan first; the others are secondary. */}
          {[...history.variants]
            .sort((a, b) => Number(b.exerciseId === facts.id) - Number(a.exerciseId === facts.id))
            .map((entry) => (
              <li key={entry.exerciseId} className={entry.exerciseId === facts.id ? 'variant-panel-current' : 'variant-panel-muted'}>
                <span>
                  {variantLabel(entry.variant, language)}
                  {entry.exerciseId === facts.id ? ` (${copy.historyThisVariant})` : ''}:{' '}
                </span>
                {entry.last && (
                  <span>
                    {fill(copy.historyLast, {
                      value: describePerformance(entry.last, language),
                      date: formatDateShort(entry.last.finishedAt.slice(0, 10), language),
                    })}
                  </span>
                )}
                {entry.best && <span> · {fill(copy.historyBest, { value: describeBest(entry.best, language) })}</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
