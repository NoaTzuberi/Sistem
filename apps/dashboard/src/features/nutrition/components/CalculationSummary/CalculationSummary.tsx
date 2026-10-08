import { useEffect, useState } from 'react';
import type { CalculationOverrides, CalorieSuggestion, FormulaSex, NutritionGoal, PortionCounts } from '@sistem/types';
import { NUTRITION_GOAL_LABELS, describeMealPortions, formatKcal } from '@sistem/shared';
import { extractErrorMessage } from '@sistem/api-client';
import { getCalorieSuggestion } from '../../../../services/coach/coachService';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { Button } from '../../../../components/common/Button/Button';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import { NO_OVERRIDES } from '../../nutritionDraft';
import type { NutritionDraft } from '../../nutritionDraft';
import './CalculationSummary.css';

const GOALS: NutritionGoal[] = ['fat_loss', 'fat_loss_aggressive', 'recomp', 'muscle_gain', 'maintenance'];
// The owner's activity levels (calorie-formula.md); "" = from her training days.
const ACTIVITY_LEVELS = [1.2, 1.375, 1.55, 1.725] as const;
const MISSING_LABELS: Record<CalorieSuggestion['missing'][number], string> = {
  weight: 'weight',
  height: 'height',
  birthDate: 'age',
  trainingFrequency: 'training days',
};
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

function signed(value: number, unit: string): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('en-US')}${unit}`;
}

/**
 * The calculation summary (PRD §5.6, 13a+): her data, BMR, TDEE, the daily deficit /
 * surplus, the safe weekly rate and timeline, the recommended kcal and portions. Every
 * number is the server's (deterministic code, never the AI); the coach can override any
 * input, the target and the meals.
 */
export function CalculationSummary({ traineeId, target, onChange, floorKcal, dayKcal, dayPortions }: CalculationSummaryProps) {
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
        .catch((failure: unknown) => current && setRequestError(extractErrorMessage(failure, NUTRITION_COPY.summaryError)));
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
          {NUTRITION_COPY.summaryTitle}
        </h2>
        {hasOverrides && (
          <Button size="sm" onClick={() => onChange({ overrides: { ...NO_OVERRIDES } })}>
            {NUTRITION_COPY.resetToHerData}
          </Button>
        )}
      </div>

      <h3 className="calculation-summary-subtitle">{NUTRITION_COPY.herData}</h3>
      <div className="calculation-summary-fields">
        <NumberField label={mark('weightKg', NUTRITION_COPY.weightKg)} value={fieldValue('weightKg')} step={0.1} onChange={(value) => setOverride('weightKg', value)} />
        <NumberField label={mark('heightCm', NUTRITION_COPY.heightCm)} value={fieldValue('heightCm')} onChange={(value) => setOverride('heightCm', value)} />
        <NumberField label={mark('ageYears', NUTRITION_COPY.age)} value={fieldValue('ageYears')} onChange={(value) => setOverride('ageYears', value)} />
        <label className="calculation-summary-field">
          <span>{NUTRITION_COPY.sex}</span>
          {inputs?.sex === 'male' || inputs?.sex === 'female' ? (
            <span className="calculation-summary-value">{inputs.sex === 'male' ? 'Male' : 'Female'}</span>
          ) : (
            <select value={formulaSex ?? ''} onChange={(event) => onChange({ formulaSex: (event.target.value || null) as FormulaSex | null })}>
              <option value="">{NUTRITION_COPY.formulaPick}</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          )}
        </label>
        <label className="calculation-summary-field">
          <span>{mark('activityFactor', NUTRITION_COPY.activity)}</span>
          <select
            value={overrides.activityFactor ?? ''}
            onChange={(event) => setOverride('activityFactor', event.target.value === '' ? undefined : Number(event.target.value))}
          >
            <option value="">
              {inputs?.trainingDays ? NUTRITION_COPY.activityFromDays(inputs.trainingDays) : NUTRITION_COPY.activityFromDays(null)}
            </option>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {NUTRITION_COPY.activityLevels[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="calculation-summary-field">
          <span>{NUTRITION_COPY.goal}</span>
          <select value={goal} onChange={(event) => onChange({ goal: event.target.value as NutritionGoal })}>
            {GOALS.map((option) => (
              <option key={option} value={option}>
                {NUTRITION_GOAL_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <NumberField label={mark('targetWeightKg', NUTRITION_COPY.targetWeight)} value={fieldValue('targetWeightKg')} step={0.5} onChange={(value) => setOverride('targetWeightKg', value)} />
        <NumberField label={mark('timelineWeeks', NUTRITION_COPY.timelineWeeks)} value={fieldValue('timelineWeeks')} onChange={(value) => setOverride('timelineWeeks', value)} />
      </div>
      {inputs && (
        <p className="calculation-summary-note">
          {NUTRITION_COPY.inputsSource(inputs.weightSource, inputs.weightDate, inputs.targetDate)}
          {overridden.size > 0 && ` ${NUTRITION_COPY.overriddenMark}`}
        </p>
      )}

      {requestError && (
        <p className="calculation-summary-error" role="alert">
          {requestError}
        </p>
      )}
      {suggestion?.status === 'needs_formula' && <p className="calculation-summary-note">{NUTRITION_COPY.suggestionNeedsFormula}</p>}
      {suggestion?.status === 'missing_inputs' && (
        <p className="calculation-summary-note">{NUTRITION_COPY.suggestionMissing(suggestion.missing.map((field) => MISSING_LABELS[field]).join(', '))}</p>
      )}

      {suggestion?.status === 'ok' && suggestion.bmr !== null && suggestion.tdee !== null && (
        <>
          <dl className="calculation-summary-numbers">
            <div>
              <dt>BMR</dt>
              <dd>{formatKcal(suggestion.bmr)}</dd>
            </div>
            <div>
              <dt>TDEE</dt>
              <dd>
                {formatKcal(suggestion.tdee)} <span className="calculation-summary-muted">(× {inputs?.activityFactor})</span>
              </dd>
            </div>
            <div>
              <dt>{(suggestion.deltaKcal ?? 0) < 0 ? NUTRITION_COPY.deficit : NUTRITION_COPY.surplus}</dt>
              <dd>
                {signed(suggestion.deltaKcal ?? 0, ' kcal/day')} <span className="calculation-summary-muted">({signed(suggestion.deltaPct ?? 0, '%')})</span>
              </dd>
            </div>
            <div>
              <dt>{NUTRITION_COPY.weeklyRate}</dt>
              <dd>{signed(suggestion.weeklyRateKg ?? 0, ' kg/week')}</dd>
            </div>
            <div>
              <dt>{NUTRITION_COPY.expectedTimeline}</dt>
              <dd>{suggestion.expectedWeeks !== null ? NUTRITION_COPY.weeks(suggestion.expectedWeeks) : '—'}</dd>
            </div>
            <div>
              <dt>{NUTRITION_COPY.method}</dt>
              <dd>{suggestion.method === 'timeline' ? NUTRITION_COPY.methodTimeline : NUTRITION_COPY.methodPercent(inputs?.adjustmentPct ?? 0)}</dd>
            </div>
          </dl>

          {timeline?.unsafe && (
            <div className="calculation-summary-warning" role="alert">
              <p>
                <strong>{NUTRITION_COPY.unsafePace(timeline.recommendedWeeks)}</strong>
              </p>
              <p>{NUTRITION_COPY.unsafeDetail(timeline.requestedWeeks, timeline.requiredRateKg, timeline.safeRateKg, timeline.limitedBy)}</p>
            </div>
          )}
          {suggestion.timelineNote && <p className="calculation-summary-note">{NUTRITION_COPY.timelineNotes[suggestion.timelineNote]}</p>}
          {suggestion.raisedToFloor && <p className="calculation-summary-note">{NUTRITION_COPY.raisedToFloor(floorKcal)}</p>}

          {suggestion.kcal !== null && (
            <div className="calculation-summary-recommended">
              <p className="calculation-summary-line">
                {NUTRITION_COPY.recommended} <strong>{formatKcal(suggestion.kcal)}</strong>
                {usingSuggestion ? (
                  <span className="calculation-summary-using"> · {NUTRITION_COPY.usingSuggestion}</span>
                ) : (
                  <Button size="sm" onClick={() => onChange({ kcal: suggestion.kcal!, source: 'suggested', confirmBelowFloor: false })}>
                    {NUTRITION_COPY.useSuggestion}
                  </Button>
                )}
              </p>
              {suggestion.portions && (
                <p className="calculation-summary-line">
                  {NUTRITION_COPY.portionsPerDay} <strong>{describeMealPortions(suggestion.portions, false)}</strong>
                  {suggestion.portionsKcal !== null && <span className="calculation-summary-muted"> (≈ {formatKcal(suggestion.portionsKcal)})</span>}
                  <span className="calculation-summary-muted">· {NUTRITION_COPY.portionsPlaceholderNote}</span>
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="calculation-summary-target">
        <NumberField
          label={`${NUTRITION_COPY.target}${target.source === 'override' && target.kcal !== undefined ? ` (${NUTRITION_COPY.override})` : ''}`}
          value={target.kcal}
          step={10}
          onChange={(kcal) => onChange({ kcal, source: kcal === undefined ? null : 'override', confirmBelowFloor: false })}
        />
        {dayKcal !== null && dayPortions && (
          <p className="calculation-summary-line">
            {NUTRITION_COPY.planNow} <strong>{describeMealPortions(dayPortions, false)}</strong> = {formatKcal(dayKcal)}
            {target.kcal !== undefined && <span className="calculation-summary-muted"> ({NUTRITION_COPY.versusTarget(dayKcal - target.kcal)})</span>}
          </p>
        )}
      </div>

      {belowFloor && (
        <div className="calculation-summary-warning" role="alert">
          <p>{NUTRITION_COPY.belowFloor(floorKcal)}</p>
          <label>
            <input type="checkbox" checked={target.confirmBelowFloor} onChange={(event) => onChange({ confirmBelowFloor: event.target.checked })} />{' '}
            {NUTRITION_COPY.confirmBelowFloor}
          </label>
        </div>
      )}
    </section>
  );
}
