import { useEffect, useState } from 'react';
import type { CalculationOverrides, CalorieSuggestion, FormulaSex, Language, NutritionGoal, PortionCounts } from '@sistem/types';
import { describeMealPortions, fill, formatKcal, formatNumber, isolateLtr, sharedCopy, useCopy, useI18n, formatDateShort } from '@sistem/shared';
import { extractErrorMessage } from '@sistem/api-client';
import { getCalorieSuggestion } from '../../../../services/coach/coachService';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { Button } from '../../../../components/common/Button/Button';
import { nutritionCopy } from '../../copy';
import { NO_OVERRIDES } from '../../nutritionDraft';
import type { NutritionDraft } from '../../nutritionDraft';
import './CalculationSummary.css';

const GOALS: NutritionGoal[] = ['fat_loss', 'fat_loss_aggressive', 'recomp', 'muscle_gain', 'maintenance'];
// The owner's activity levels (calorie-formula.md); "" = from her training days.
const ACTIVITY_LEVELS = [1.2, 1.375, 1.55, 1.725] as const;
// Waits for typing to settle before asking the server again.
const REFRESH_DELAY_MS = 300;

interface CalculationSummaryProps {
  traineeId: string;
  target: NutritionDraft['target'];
  onChange: (patch: Partial<NutritionDraft['target']>) => void;
  floorKcal: number;
  /** The plan as the server last computed it. */
  dayKcal: number | null;
  dayPortions: PortionCounts | null;
}

/** '+250 kcal', '−1,200' — the sign stays in front of the number in Hebrew text too. */
function signed(value: number, unit: string, language: Language): string {
  return isolateLtr(`${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), language)}`) + unit;
}

/**
 * The calculation summary (PRD §5.6, 13a+): her data, BMR, TDEE, the daily deficit /
 * surplus, the safe weekly rate and timeline, the recommended kcal and portions. Every
 * number is the server's (deterministic code, never the AI); the coach can override any
 * input, the target and the meals.
 */
export function CalculationSummary({ traineeId, target, onChange, floorKcal, dayKcal, dayPortions }: CalculationSummaryProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const { language, plural } = useI18n();
  // The last good answer stays on screen while a new one is on its way (or was refused).
  const [suggestion, setSuggestion] = useState<CalorieSuggestion | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { goal, formulaSex, overrides } = target;
  const overridesKey = JSON.stringify(overrides);

  useEffect(() => {
    let current = true;
    const params = Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== null)) as Partial<Record<keyof CalculationOverrides, number>>;
    const timer = window.setTimeout(() => {
      getCalorieSuggestion(traineeId, { goal, ...(formulaSex ? { formula: formulaSex } : {}), ...params })
        .then((next) => {
          if (!current) return;
          setSuggestion(next);
          setRequestError(null);
        })
        .catch((failure: unknown) => current && setRequestError(extractErrorMessage(failure, copy.summaryError)));
    }, REFRESH_DELAY_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
    // overridesKey stands for `overrides` (a new object on every draft change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traineeId, goal, formulaSex, overridesKey]);

  function setOverride(key: keyof CalculationOverrides, value: number | undefined) {
    onChange({ overrides: { ...overrides, [key]: value ?? null } });
  }

  const inputs = suggestion?.inputs;
  // Her value, or the coach's own while she types (an in-between value may be refused).
  const fieldValue = (key: keyof CalculationOverrides) => overrides[key] ?? inputs?.[key] ?? undefined;
  const overridden = new Set(inputs?.overridden ?? []);
  const mark = (key: keyof CalculationOverrides, label: string) => (overridden.has(key) ? `${label} •` : label);
  const usingSuggestion = target.source === 'suggested' && suggestion?.kcal === target.kcal;
  const belowFloor = target.kcal !== undefined && target.kcal < floorKcal;
  const hasOverrides = Object.values(overrides).some((value) => value !== null);
  const timeline = suggestion?.timeline;

  return (
    <section className="calculation-summary" aria-labelledby="calculation-summary-title">
      <div className="calculation-summary-head">
        <h2 className="nutrition-panel-title" id="calculation-summary-title">
          {copy.summaryTitle}
        </h2>
        {hasOverrides && (
          <Button size="sm" onClick={() => onChange({ overrides: { ...NO_OVERRIDES } })}>
            {copy.resetToHerData}
          </Button>
        )}
      </div>

      <h3 className="calculation-summary-subtitle">{copy.herData}</h3>
      <div className="calculation-summary-fields">
        <NumberField label={mark('weightKg', copy.weightKg)} value={fieldValue('weightKg')} step={0.1} onChange={(value) => setOverride('weightKg', value)} />
        <NumberField label={mark('heightCm', copy.heightCm)} value={fieldValue('heightCm')} onChange={(value) => setOverride('heightCm', value)} />
        <NumberField label={mark('ageYears', copy.age)} value={fieldValue('ageYears')} onChange={(value) => setOverride('ageYears', value)} />
        <label className="calculation-summary-field">
          <span>{copy.sex}</span>
          {inputs?.sex === 'male' || inputs?.sex === 'female' ? (
            <span className="calculation-summary-value">{shared.onboardingOptions.gender[inputs.sex]}</span>
          ) : (
            <select value={formulaSex ?? ''} onChange={(event) => onChange({ formulaSex: (event.target.value || null) as FormulaSex | null })}>
              <option value="">{copy.formulaPick}</option>
              <option value="female">{shared.onboardingOptions.gender.female}</option>
              <option value="male">{shared.onboardingOptions.gender.male}</option>
            </select>
          )}
        </label>
        <label className="calculation-summary-field">
          <span>{mark('activityFactor', copy.activity)}</span>
          <select
            value={overrides.activityFactor ?? ''}
            onChange={(event) => setOverride('activityFactor', event.target.value === '' ? undefined : Number(event.target.value))}
          >
            <option value="">
              {inputs?.trainingDays ? fill(copy.activityFromDays, { days: inputs.trainingDays }) : copy.activityFromDaysUnknown}
            </option>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {copy.activityLevels[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="calculation-summary-field">
          <span>{copy.goal}</span>
          <select value={goal} onChange={(event) => onChange({ goal: event.target.value as NutritionGoal })}>
            {GOALS.map((option) => (
              <option key={option} value={option}>
                {shared.nutrition.goals[option]}
              </option>
            ))}
          </select>
        </label>
        <NumberField label={mark('targetWeightKg', copy.targetWeight)} value={fieldValue('targetWeightKg')} step={0.5} onChange={(value) => setOverride('targetWeightKg', value)} />
        <NumberField label={mark('timelineWeeks', copy.timelineWeeks)} value={fieldValue('timelineWeeks')} onChange={(value) => setOverride('timelineWeeks', value)} />
      </div>
      {inputs && (
        <p className="calculation-summary-note">
          {[
            inputs.weightSource === 'weigh_in'
              ? fill(copy.sourceWeighIn, { date: inputs.weightDate ? formatDateShort(inputs.weightDate, language) : '' })
              : inputs.weightSource === 'onboarding'
                ? copy.sourceOnboarding
                : inputs.weightSource === 'coach'
                  ? copy.sourceCoach
                  : null,
            inputs.targetDate ? fill(copy.sourceTargetDate, { date: formatDateShort(inputs.targetDate, language) }) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          {overridden.size > 0 && ` ${copy.overriddenMark}`}
        </p>
      )}

      {requestError && (
        <p className="calculation-summary-error" role="alert">
          {requestError}
        </p>
      )}
      {suggestion?.status === 'needs_formula' && <p className="calculation-summary-note">{copy.suggestionNeedsFormula}</p>}
      {suggestion?.status === 'missing_inputs' && (
        <p className="calculation-summary-note">{fill(copy.suggestionMissing, { fields: suggestion.missing.map((field) => copy.missing[field]).join(shared.common.listSeparator) })}</p>
      )}

      {suggestion?.status === 'ok' && suggestion.bmr !== null && suggestion.tdee !== null && (
        <>
          <dl className="calculation-summary-numbers">
            <div>
              <dt>{copy.bmr}</dt>
              <dd>{formatKcal(suggestion.bmr, language)}</dd>
            </div>
            <div>
              <dt>{copy.tdee}</dt>
              <dd>
                {formatKcal(suggestion.tdee, language)} <span className="calculation-summary-muted">(× {inputs?.activityFactor})</span>
              </dd>
            </div>
            <div>
              <dt>{(suggestion.deltaKcal ?? 0) < 0 ? copy.deficit : copy.surplus}</dt>
              <dd>
                {signed(suggestion.deltaKcal ?? 0, copy.kcalPerDay, language)} <span className="calculation-summary-muted">({signed(suggestion.deltaPct ?? 0, '%', language)})</span>
              </dd>
            </div>
            <div>
              <dt>{copy.weeklyRate}</dt>
              <dd>{signed(suggestion.weeklyRateKg ?? 0, copy.kgPerWeek, language)}</dd>
            </div>
            <div>
              <dt>{copy.expectedTimeline}</dt>
              <dd>{suggestion.expectedWeeks !== null ? plural(copy.weeks, suggestion.expectedWeeks) : '—'}</dd>
            </div>
            <div>
              <dt>{copy.method}</dt>
              <dd>{suggestion.method === 'timeline' ? copy.methodTimeline : fill(copy.methodPercent, { pct: signed(inputs?.adjustmentPct ?? 0, '', language) })}</dd>
            </div>
          </dl>

          {timeline?.unsafe && (
            <div className="calculation-summary-warning" role="alert">
              <p>
                <strong>{fill(copy.unsafePace, { weeks: timeline.recommendedWeeks ?? '—' })}</strong>
              </p>
              <p>{fill(copy.unsafeDetail, {
                  weeks: timeline.requestedWeeks,
                  required: timeline.requiredRateKg,
                  safe: timeline.safeRateKg,
                  limit: timeline.limitedBy === 'rate' ? copy.limitRate : timeline.limitedBy === 'max_deficit' ? copy.limitMaxDeficit : copy.limitFloor,
                })}</p>
            </div>
          )}
          {suggestion.timelineNote && <p className="calculation-summary-note">{copy.timelineNotes[suggestion.timelineNote]}</p>}
          {suggestion.raisedToFloor && <p className="calculation-summary-note">{fill(copy.raisedToFloor, { floor: formatNumber(floorKcal, language) })}</p>}

          {suggestion.kcal !== null && (
            <div className="calculation-summary-recommended">
              <p className="calculation-summary-line">
                {copy.recommended} <strong>{formatKcal(suggestion.kcal, language)}</strong>
                {usingSuggestion ? (
                  <span className="calculation-summary-using"> · {copy.usingSuggestion}</span>
                ) : (
                  <Button size="sm" onClick={() => onChange({ kcal: suggestion.kcal!, source: 'suggested', confirmBelowFloor: false })}>
                    {copy.useSuggestion}
                  </Button>
                )}
              </p>
              {suggestion.portions && (
                <p className="calculation-summary-line">
                  {copy.portionsPerDay} <strong>{describeMealPortions(suggestion.portions, false, language)}</strong>
                  {suggestion.portionsKcal !== null && <span className="calculation-summary-muted"> (≈ {formatKcal(suggestion.portionsKcal, language)})</span>}
                  <span className="calculation-summary-muted">· {copy.portionsPlaceholderNote}</span>
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="calculation-summary-target">
        <NumberField
          label={`${copy.target}${target.source === 'override' && target.kcal !== undefined ? ` (${copy.override})` : ''}`}
          value={target.kcal}
          step={10}
          onChange={(kcal) => onChange({ kcal, source: kcal === undefined ? null : 'override', confirmBelowFloor: false })}
        />
        {dayKcal !== null && dayPortions && (
          <p className="calculation-summary-line">
            {copy.planNow} <strong>{describeMealPortions(dayPortions, false, language)}</strong> = {formatKcal(dayKcal, language)}
            {target.kcal !== undefined && <span className="calculation-summary-muted"> ({fill(copy.versusTarget, { diff: signed(dayKcal - target.kcal, '', language) })})</span>}
          </p>
        )}
      </div>

      {belowFloor && (
        <div className="calculation-summary-warning" role="alert">
          <p>{fill(copy.belowFloor, { floor: formatNumber(floorKcal, language) })}</p>
          <label>
            <input type="checkbox" checked={target.confirmBelowFloor} onChange={(event) => onChange({ confirmBelowFloor: event.target.checked })} />{' '}
            {copy.confirmBelowFloor}
          </label>
        </div>
      )}
    </section>
  );
}
