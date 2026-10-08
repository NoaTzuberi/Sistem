import { useEffect, useState } from 'react';
import type { CalorieSuggestion, FormulaSex, NutritionGoal } from '@sistem/types';
import { NUTRITION_GOAL_LABELS, formatKcal } from '@sistem/shared';
import { getCalorieSuggestion } from '../../../../services/coach/coachService';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { Button } from '../../../../components/common/Button/Button';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import type { NutritionDraft } from '../../nutritionDraft';
import './CalorieTargetPanel.css';

const GOALS: NutritionGoal[] = ['fat_loss', 'recomp', 'muscle_gain', 'maintenance'];
const MISSING_LABELS: Record<CalorieSuggestion['missing'][number], string> = {
  weight: 'weight',
  height: 'height',
  birthDate: 'birth date',
  trainingFrequency: 'training days',
};

interface CalorieTargetPanelProps {
  traineeId: string;
  target: NutritionDraft['target'];
  onChange: (patch: Partial<NutritionDraft['target']>) => void;
  floorKcal: number;
  /** The day's kcal as the server last computed it. */
  dayKcal: number | null;
}

/** Every number the estimate used, so the coach sees where it comes from. */
function describeInputs(suggestion: CalorieSuggestion): string {
  const inputs = suggestion.inputs;
  const parts: string[] = [];
  if (inputs.weightKg !== null) {
    parts.push(`${inputs.weightKg} kg (${inputs.weightSource === 'weigh_in' ? `weigh-in ${inputs.weightDate}` : 'onboarding'})`);
  }
  if (inputs.heightCm !== null) parts.push(`${inputs.heightCm} cm`);
  if (inputs.ageYears !== null) parts.push(`${inputs.ageYears} y`);
  if (inputs.formulaSex) parts.push(`Mifflin-St Jeor, ${inputs.formulaSex}`);
  if (suggestion.bmr !== null) parts.push(`BMR ${suggestion.bmr.toLocaleString('en-US')}`);
  if (inputs.trainingDays !== null && inputs.activityFactor !== null) {
    parts.push(`× ${inputs.activityFactor} (${inputs.trainingDays} training days)`);
  }
  if (suggestion.tdee !== null) parts.push(`= ${suggestion.tdee.toLocaleString('en-US')}`);
  parts.push(`${NUTRITION_GOAL_LABELS[inputs.goal]} ${inputs.adjustmentPct > 0 ? '+' : ''}${inputs.adjustmentPct}%`);
  return NUTRITION_COPY.inputsLine(parts);
}

/**
 * The calorie target (PRD §5.6): the server's suggestion with its inputs, approved or
 * overridden by the coach. Below the floor she must confirm it explicitly.
 */
export function CalorieTargetPanel({ traineeId, target, onChange, floorKcal, dayKcal }: CalorieTargetPanelProps) {
  const [suggestion, setSuggestion] = useState<CalorieSuggestion | null>(null);

  useEffect(() => {
    let current = true;
    getCalorieSuggestion(traineeId, { goal: target.goal, ...(target.formulaSex ? { formula: target.formulaSex } : {}) })
      .then((next) => current && setSuggestion(next))
      .catch(() => current && setSuggestion(null));
    return () => {
      current = false;
    };
  }, [traineeId, target.goal, target.formulaSex]);

  const usingSuggestion = target.source === 'suggested' && suggestion?.kcal === target.kcal;
  const belowFloor = target.kcal !== undefined && target.kcal < floorKcal;

  return (
    <section className="calorie-target" aria-labelledby="calorie-target-title">
      <h2 className="nutrition-panel-title" id="calorie-target-title">
        {NUTRITION_COPY.targetTitle}
      </h2>

      <div className="calorie-target-row">
        <label className="calorie-target-field">
          <span>{NUTRITION_COPY.goal}</span>
          <select value={target.goal} onChange={(event) => onChange({ goal: event.target.value as NutritionGoal })}>
            {GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {NUTRITION_GOAL_LABELS[goal]}
              </option>
            ))}
          </select>
        </label>

        {(suggestion?.status === 'needs_formula' || target.formulaSex) && (
          <label className="calorie-target-field">
            <span>{NUTRITION_COPY.formula}</span>
            <select
              value={target.formulaSex ?? ''}
              onChange={(event) => onChange({ formulaSex: (event.target.value || null) as FormulaSex | null })}
            >
              <option value="">{NUTRITION_COPY.formulaPick}</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
        )}
      </div>

      {suggestion?.status === 'ok' && suggestion.kcal !== null && (
        <div className="calorie-target-suggestion">
          <p className="calorie-target-suggested">
            {NUTRITION_COPY.suggestion} <strong>{formatKcal(suggestion.kcal)}</strong>
            {usingSuggestion ? (
              <span className="calorie-target-using"> · {NUTRITION_COPY.usingSuggestion}</span>
            ) : (
              <Button size="sm" onClick={() => onChange({ kcal: suggestion.kcal!, source: 'suggested', confirmBelowFloor: false })}>
                {NUTRITION_COPY.useSuggestion}
              </Button>
            )}
          </p>
          <p className="calorie-target-inputs">{describeInputs(suggestion)}</p>
        </div>
      )}
      {suggestion?.status === 'needs_formula' && <p className="calorie-target-inputs">{NUTRITION_COPY.suggestionNeedsFormula}</p>}
      {suggestion?.status === 'missing_inputs' && (
        <p className="calorie-target-inputs">
          {NUTRITION_COPY.suggestionMissing(suggestion.missing.map((field) => MISSING_LABELS[field]).join(', '))}
        </p>
      )}

      <div className="calorie-target-row">
        <NumberField
          label={`${NUTRITION_COPY.target}${target.source === 'override' && target.kcal !== undefined ? ` (${NUTRITION_COPY.override})` : ''}`}
          value={target.kcal}
          step={10}
          onChange={(kcal) => onChange({ kcal, source: kcal === undefined ? null : 'override', confirmBelowFloor: false })}
        />
        {dayKcal !== null && (
          <p className="calorie-target-total">
            {NUTRITION_COPY.dayTotal} <strong>{formatKcal(dayKcal)}</strong>
            {target.kcal !== undefined && <span> ({NUTRITION_COPY.versusTarget(dayKcal - target.kcal)})</span>}
          </p>
        )}
      </div>

      {belowFloor && (
        <div className="calorie-target-floor" role="alert">
          <p>{NUTRITION_COPY.belowFloor(floorKcal)}</p>
          <label>
            <input
              type="checkbox"
              checked={target.confirmBelowFloor}
              onChange={(event) => onChange({ confirmBelowFloor: event.target.checked })}
            />{' '}
            {NUTRITION_COPY.confirmBelowFloor}
          </label>
        </div>
      )}
    </section>
  );
}
