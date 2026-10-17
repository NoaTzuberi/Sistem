import { useEffect, useState } from 'react';
import type { ExerciseFamilyDetail, ExerciseFamilySummary, PatternId } from '@sistem/types';
import { fill, formatDateShort, patternLabel, useCopy, useLanguage, variantLabel } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { searchExerciseFamilies } from '../../../../services/coach/coachService';
import { PATTERN_FILTERS } from '../../../planBuilder/data/exerciseFilters';
import type { FamilyReview } from '../../hooks/useFamilyReview';
import { exerciseLibraryCopy } from '../../copy';
import './FamilyTools.css';

const MERGE_SEARCH_DEBOUNCE_MS = 300;
const MERGE_RESULTS = 8;

interface FamilyToolsProps {
  family: ExerciseFamilyDetail;
  review: FamilyReview;
}

/**
 * The library's other tools for this family, folded away: rename, set the patterns of any family,
 * move exercises into a new family, merge another family in, and put a reviewed family back on
 * the list. All through the existing endpoints.
 */
export function FamilyTools({ family, review }: FamilyToolsProps) {
  const language = useLanguage();
  const copy = useCopy(exerciseLibraryCopy);
  const [name, setName] = useState(family.name);
  const [patterns, setPatterns] = useState<PatternId[]>(family.patterns);
  const [selected, setSelected] = useState<string[]>([]);
  const [mergeQuery, setMergeQuery] = useState('');
  const [mergeResults, setMergeResults] = useState<ExerciseFamilySummary[]>([]);

  // A save (here or in the issue panel) brings the fields back to the family as it is now.
  useEffect(() => {
    setName(family.name);
    setPatterns(family.patterns);
    setSelected([]);
  }, [family]);

  useEffect(() => {
    const query = mergeQuery.trim();
    if (!query) {
      setMergeResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      searchExerciseFamilies({ search: query, limit: MERGE_RESULTS })
        .then((result) => active && setMergeResults(result.items.filter((item) => item.id !== family.id)))
        .catch(() => active && setMergeResults([]));
    }, MERGE_SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mergeQuery, family.id]);

  const patternsChanged = [...patterns].sort().join() !== [...family.patterns].sort().join();
  const togglePattern = (pattern: PatternId) => setPatterns((current) => (current.includes(pattern) ? current.filter((id) => id !== pattern) : [...current, pattern]));

  function handleSplit() {
    if (window.confirm(fill(copy.splitConfirm, { count: selected.length }))) void review.split(selected);
  }

  function handleMerge(source: ExerciseFamilySummary) {
    if (!window.confirm(fill(copy.mergeConfirm, { name: source.name, target: family.name }))) return;
    setMergeQuery('');
    void review.merge(source.id);
  }

  return (
    <details className="family-tools">
      <summary className="family-tools-summary">{copy.moreActions}</summary>
      <div className="family-tools-body">
        <div className="family-tools-row">
          <label className="family-tools-field">
            <span className="family-tools-label">{copy.name}</span>
            <input className="family-tools-input" dir="auto" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <PillButton variant="fill" size="sm" disabled={review.isBusy || !name.trim() || name.trim() === family.name} onClick={() => void review.rename(name)}>
            {copy.saveName}
          </PillButton>
        </div>
        {family.source === 'coach' && <p className="family-tools-muted">{copy.editedByYou}</p>}

        <fieldset className="family-tools-group">
          <legend className="family-tools-label">{copy.patterns}</legend>
          <p className="family-tools-muted">{copy.patternsHint}</p>
          <div className="family-tools-chips">
            {PATTERN_FILTERS.map((pattern) => (
              <button key={pattern} type="button" className="family-tools-chip" aria-pressed={patterns.includes(pattern)} onClick={() => togglePattern(pattern)}>
                {patternLabel(pattern, language)}
              </button>
            ))}
          </div>
          <PillButton variant="fill" size="sm" disabled={review.isBusy || !patternsChanged} onClick={() => void review.savePatterns(patterns)}>
            {copy.savePatterns}
          </PillButton>
        </fieldset>

        <fieldset className="family-tools-group">
          <legend className="family-tools-label">{copy.members}</legend>
          <ul className="family-tools-list">
            {family.members.map((member) => {
              const isSelected = selected.includes(member.exerciseId);
              return (
                <li key={member.exerciseId}>
                  {/* A toggle row: pressed = picked for "split off". */}
                  <button
                    className="family-tools-member"
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      setSelected((current) => (isSelected ? current.filter((id) => id !== member.exerciseId) : [...current, member.exerciseId]))
                    }
                  >
                    <span className="family-tools-member-mark" aria-hidden="true">
                      {isSelected && <Icon name="check" size="sm" />}
                    </span>
                    <bdi className="family-tools-member-name">{member.name}</bdi>
                    <span className="family-tools-muted">
                      {variantLabel(member.variant, language)}
                      {member.isPrimary ? ` · ${copy.primary}` : ` · ${copy.copyTag}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <PillButton variant="fill" size="sm" disabled={review.isBusy || selected.length === 0 || selected.length === family.members.length} onClick={handleSplit}>
            {copy.splitOff}
          </PillButton>
        </fieldset>

        <div className="family-tools-group">
          <label className="family-tools-field">
            <span className="family-tools-label">{copy.merge}</span>
            <input className="family-tools-input" type="search" dir="auto" placeholder={copy.mergeSearch} value={mergeQuery} onChange={(event) => setMergeQuery(event.target.value)} />
          </label>
          {mergeResults.length > 0 && (
            <ul className="family-tools-list">
              {mergeResults.map((result) => (
                <li key={result.id} className="family-tools-merge">
                  <bdi className="family-tools-member-name">{result.name}</bdi>
                  <PillButton variant="fill" size="sm" disabled={review.isBusy} onClick={() => handleMerge(result)}>
                    {copy.mergeButton}
                  </PillButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {family.reviewedAt && (
          <div className="family-tools-row">
            <span className="family-tools-muted">{fill(copy.reviewedOn, { date: formatDateShort(family.reviewedAt.slice(0, 10), language) })}</span>
            <PillButton variant="fill" size="sm" disabled={review.isBusy} onClick={() => void review.unreview()}>
              {copy.unreview}
            </PillButton>
          </div>
        )}
      </div>
    </details>
  );
}
