import { useCallback, useEffect, useState } from 'react';
import type { ExerciseFamilyDetail, ExerciseFamilySummary, PatternId } from '@sistem/types';
import {
  fill,
  formatDateShort,
  getActiveLanguage,
  humanizeId,
  patternLabel,
  reviewReasonLabel,
  sharedCopy,
  useCopy,
  useLanguage,
  useLoad,
  variantLabel,
} from '@sistem/shared';
import {
  getExerciseFamily,
  mergeExerciseFamily,
  searchExerciseFamilies,
  setExerciseFamilyPrimary,
  splitExerciseFamily,
  updateExerciseFamily,
} from '../../../../services/coach/coachService';
import { extractErrorMessage } from '@sistem/api-client';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { PATTERN_FILTERS } from '../../../planBuilder/data/exerciseFilters';
import { exerciseLibraryCopy } from '../../copy';
import './FamilyDetail.css';

const MERGE_SEARCH_DEBOUNCE_MS = 300;
const MERGE_RESULTS = 8;

interface FamilyDetailProps {
  familyId: string;
  /** Something changed; `nextFamilyId` = select that family instead (after a split). */
  onChanged: (nextFamilyId?: string) => void;
}

/** One family: name, patterns, its exercises (main per variant, copies), split / merge, reviewed. */
export function FamilyDetail({ familyId, onChanged }: FamilyDetailProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(exerciseLibraryCopy);
  const load = useCallback(() => getExerciseFamily(familyId), [familyId]);
  const { data: loaded, error: loadError, isLoading } = useLoad(load, exerciseLibraryCopy[getActiveLanguage()].loadError);
  const [family, setFamily] = useState<ExerciseFamilyDetail>();
  const [name, setName] = useState('');
  const [patterns, setPatterns] = useState<PatternId[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mergeQuery, setMergeQuery] = useState('');
  const [mergeResults, setMergeResults] = useState<ExerciseFamilySummary[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!loaded) return;
    setFamily(loaded);
    setName(loaded.name);
    setPatterns(loaded.patterns);
    setSelected([]);
  }, [loaded]);

  useEffect(() => {
    const query = mergeQuery.trim();
    if (!query) {
      setMergeResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      searchExerciseFamilies({ search: query, limit: MERGE_RESULTS })
        .then((result) => active && setMergeResults(result.items.filter((item) => item.id !== familyId)))
        .catch(() => active && setMergeResults([]));
    }, MERGE_SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mergeQuery, familyId]);

  async function run(action: () => Promise<ExerciseFamilyDetail>, select?: (result: ExerciseFamilyDetail) => string | undefined) {
    setIsBusy(true);
    setError(undefined);
    try {
      const result = await action();
      const next = select?.(result);
      if (!next) {
        setFamily(result);
        setName(result.name);
        setPatterns(result.patterns);
        setSelected([]);
      }
      onChanged(next);
    } catch (failure) {
      // The server's message is already in her language.
      setError(extractErrorMessage(failure, exerciseLibraryCopy[getActiveLanguage()].actionError));
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading && !family) return <p className="family-detail-muted">{shared.common.loading}</p>;
  if (loadError || !family) return <p className="family-detail-error">{loadError}</p>;

  const togglePattern = (pattern: PatternId) =>
    setPatterns((current) => (current.includes(pattern) ? current.filter((p) => p !== pattern) : [...current, pattern]));
  const patternsChanged = [...patterns].sort().join() !== [...family.patterns].sort().join();

  function handleSplit() {
    if (!window.confirm(fill(copy.splitConfirm, { count: selected.length }))) return;
    void run(() => splitExerciseFamily(familyId, selected), (created) => created.id);
  }

  function handleMerge(source: ExerciseFamilySummary) {
    if (!window.confirm(fill(copy.mergeConfirm, { name: source.name, target: family!.name }))) return;
    setMergeQuery('');
    void run(() => mergeExerciseFamily(familyId, source.id));
  }

  return (
    <div className="family-detail">
      <div className="family-detail-row">
        <label className="family-detail-field">
          <span className="family-detail-label">{copy.name}</span>
          <input className="family-detail-input" dir="auto" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <Button size="sm" disabled={isBusy || !name.trim() || name.trim() === family.name} onClick={() => void run(() => updateExerciseFamily(familyId, { name }))}>
          {copy.saveName}
        </Button>
      </div>
      {family.source === 'coach' && <p className="family-detail-muted">{copy.editedByYou}</p>}
      <p className="family-detail-muted">
        {copy.muscles}: {family.muscles.map(humanizeId).join(', ') || '—'}
      </p>

      {family.reviewReasons.length > 0 && (
        <div>
          <p className="family-detail-label">{copy.reasons}</p>
          <div className="family-detail-badges">
            {family.reviewReasons.map((reason) => (
              <Badge key={reason} tone={family.reviewedAt ? 'neutral' : 'alert'}>
                {reviewReasonLabel(reason, language)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <fieldset className="family-detail-patterns">
        <legend className="family-detail-label">{copy.patterns}</legend>
        <p className="family-detail-muted">{copy.patternsHint}</p>
        <div className="family-detail-chips">
          {PATTERN_FILTERS.map((pattern) => (
            <button key={pattern} type="button" className="family-detail-chip" aria-pressed={patterns.includes(pattern)} onClick={() => togglePattern(pattern)}>
              {patternLabel(pattern, language)}
            </button>
          ))}
        </div>
        <Button size="sm" disabled={isBusy || !patternsChanged} onClick={() => void run(() => updateExerciseFamily(familyId, { patterns }))}>
          {copy.savePatterns}
        </Button>
      </fieldset>

      <div>
        <p className="family-detail-label">{copy.members}</p>
        <ul className="family-detail-members">
          {family.members.map((member) => (
            <li key={member.exerciseId} className="family-detail-member">
              <input
                type="checkbox"
                aria-label={fill(copy.selectMember, { name: member.name })}
                checked={selected.includes(member.exerciseId)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked ? [...current, member.exerciseId] : current.filter((id) => id !== member.exerciseId),
                  )
                }
              />
              <span className="family-detail-member-text">
                <bdi className="family-detail-member-name">{member.name}</bdi>
                <span className="family-detail-muted">
                  {variantLabel(member.variant, language)} · {shared.training.levels[member.difficulty as keyof typeof shared.training.levels] ?? member.difficulty}
                </span>
              </span>
              {member.isPrimary ? (
                <Badge tone="accent">{copy.primary}</Badge>
              ) : (
                <>
                  <span className="family-detail-muted">{copy.copyTag}</span>
                  <Button size="sm" disabled={isBusy} onClick={() => void run(() => setExerciseFamilyPrimary(familyId, member.exerciseId))}>
                    {copy.makePrimary}
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
        <Button size="sm" disabled={isBusy || selected.length === 0 || selected.length === family.members.length} onClick={handleSplit}>
          {copy.splitOff}
        </Button>
      </div>

      <div className="family-detail-merge">
        <label className="family-detail-field">
          <span className="family-detail-label">{copy.merge}</span>
          <input
            className="family-detail-input"
            type="search"
            dir="auto"
            placeholder={copy.mergeSearch}
            value={mergeQuery}
            onChange={(event) => setMergeQuery(event.target.value)}
          />
        </label>
        {mergeResults.length > 0 && (
          <ul className="family-detail-members">
            {mergeResults.map((result) => (
              <li key={result.id} className="family-detail-member">
                <span className="family-detail-member-text">
                  <bdi className="family-detail-member-name">{result.name}</bdi>
                  <span className="family-detail-muted">{result.patterns.map((id) => patternLabel(id, language)).join(', ') || '—'}</span>
                </span>
                <Button size="sm" disabled={isBusy} onClick={() => handleMerge(result)}>
                  {copy.mergeButton}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="family-detail-row">
        {family.reviewedAt ? (
          <>
            <span className="family-detail-muted">{fill(copy.reviewedOn, { date: formatDateShort(family.reviewedAt.slice(0, 10), language) })}</span>
            <Button size="sm" disabled={isBusy} onClick={() => void run(() => updateExerciseFamily(familyId, { reviewed: false }))}>
              {copy.unreview}
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" disabled={isBusy} onClick={() => void run(() => updateExerciseFamily(familyId, { reviewed: true }))}>
            {copy.markReviewed}
          </Button>
        )}
      </div>

      {error && (
        <p className="family-detail-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
