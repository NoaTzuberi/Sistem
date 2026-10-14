import type { CalculationOverrides, CalorieSuggestionInputs, FormulaSex } from '@sistem/types';
import { fill, formatDateShort, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import './HerDataFields.css';

// The owner's activity levels (calorie-formula.md); "" = from her training days.
const ACTIVITY_LEVELS = [1.2, 1.375, 1.55, 1.725] as const;

interface HerDataFieldsProps {
  inputs: CalorieSuggestionInputs | undefined;
  overrides: CalculationOverrides;
  formulaSex: FormulaSex | null;
  onOverride: (key: keyof CalculationOverrides, value: number | undefined) => void;
  onFormulaSex: (sex: FormulaSex | null) => void;
  onReset: () => void;
}

/** Her numbers as soft tiles: her values (or the coach's own, marked), sex read-only, activity, and the optional target and timeframe. */
export function HerDataFields({ inputs, overrides, formulaSex, onOverride, onFormulaSex, onReset }: HerDataFieldsProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const b = copy.builder;
  const overridden = new Set(inputs?.overridden ?? []);
  // Her value, or the coach's own while she types (an in-between value may be refused).
  const valueOf = (key: keyof CalculationOverrides) => overrides[key] ?? inputs?.[key] ?? '';
  const hasOverrides = Object.values(overrides).some((value) => value !== null);
  const source = [
    inputs?.weightSource === 'weigh_in'
      ? fill(copy.sourceWeighIn, { date: inputs.weightDate ? formatDateShort(inputs.weightDate, language) : '' })
      : inputs?.weightSource === 'onboarding'
        ? copy.sourceOnboarding
        : inputs?.weightSource === 'coach'
          ? copy.sourceCoach
          : null,
    inputs?.targetDate ? fill(copy.sourceTargetDate, { date: formatDateShort(inputs.targetDate, language) }) : null,
  ].filter(Boolean);

  function field(key: keyof CalculationOverrides, label: string, unit: string, step: number, optional = false) {
    const id = `nb-field-${key}`;
    return (
      <div className="nb-field" data-overridden={overridden.has(key) || undefined}>
        <label className="nb-field-label" htmlFor={id}>
          {label}
          {overridden.has(key) && <span aria-hidden="true"> •</span>}
          {optional && <span className="nb-field-optional">{b.optional}</span>}
        </label>
        <input
          className="nb-field-input"
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={valueOf(key)}
          onChange={(event) => onOverride(key, event.target.value === '' ? undefined : Number(event.target.value))}
        />
        <span className="nb-field-unit" aria-hidden="true">
          {unit}
        </span>
      </div>
    );
  }

  return (
    <div className="nb-her-data">
      <div className="nb-her-data-head">
        <h3 className="nb-subtitle">{copy.herData}</h3>
        {source.length > 0 && <span className="nb-source">{[b.fromQuestionnaire, ...source].join(' · ')}</span>}
        {hasOverrides && (
          <button className="nb-text-button" type="button" onClick={onReset}>
            {copy.resetToHerData}
          </button>
        )}
      </div>
      <div className="nb-fields">
        {field('weightKg', b.weight, b.kg, 0.1)}
        {field('heightCm', b.height, b.cm, 1)}
        {field('ageYears', copy.age, b.years, 1)}
        <div className="nb-field nb-field-readonly">
          <span className="nb-field-label">{copy.sex}</span>
          {inputs?.sex === 'male' || inputs?.sex === 'female' ? (
            <b className="nb-field-value">{shared.onboardingOptions.gender[inputs.sex]}</b>
          ) : (
            <select className="nb-field-input nb-field-select" aria-label={copy.formula} value={formulaSex ?? ''} onChange={(event) => onFormulaSex((event.target.value || null) as FormulaSex | null)}>
              <option value="">{copy.formulaPick}</option>
              <option value="female">{shared.onboardingOptions.gender.female}</option>
              <option value="male">{shared.onboardingOptions.gender.male}</option>
            </select>
          )}
        </div>
        <div className="nb-field nb-field-wide" data-overridden={overridden.has('activityFactor') || undefined}>
          <label className="nb-field-label" htmlFor="nb-field-activity">
            {copy.activity}
            {overridden.has('activityFactor') && <span aria-hidden="true"> •</span>}
          </label>
          <select
            className="nb-field-input nb-field-select"
            id="nb-field-activity"
            value={overrides.activityFactor ?? ''}
            onChange={(event) => onOverride('activityFactor', event.target.value === '' ? undefined : Number(event.target.value))}
          >
            <option value="">{inputs?.trainingDays ? fill(copy.activityFromDays, { days: inputs.trainingDays }) : copy.activityFromDaysUnknown}</option>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {copy.activityLevels[level]}
              </option>
            ))}
          </select>
        </div>
        {field('targetWeightKg', b.targetWeight, b.kg, 0.5, true)}
        {field('timelineWeeks', b.timeline, b.weeksUnit, 1, true)}
      </div>
      {overridden.size > 0 && <p className="nb-note">{copy.overriddenMark}</p>}
    </div>
  );
}
