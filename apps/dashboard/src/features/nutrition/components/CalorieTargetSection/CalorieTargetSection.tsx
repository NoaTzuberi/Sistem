import type { CalorieSuggestion, NutritionGoal, PortionCounts } from '@sistem/types';
import { fill, sharedCopy, useCopy } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import { sectionId } from '../../data/scrollToSection';
import { NO_OVERRIDES } from '../../nutritionDraft';
import type { NutritionDraft } from '../../nutritionDraft';
import { CalcEquation } from '../CalcEquation/CalcEquation';
import { DailyTarget } from '../DailyTarget/DailyTarget';
import { GoalSegmented } from '../GoalSegmented/GoalSegmented';
import { HerDataFields } from '../HerDataFields/HerDataFields';
import './CalorieTargetSection.css';

interface CalorieTargetSectionProps {
  target: NutritionDraft['target'];
  onChange: (patch: Partial<NutritionDraft['target']>) => void;
  suggestion: CalorieSuggestion | null;
  requestError: string | null;
  floorKcal: number;
  goalAdjustments: Record<NutritionGoal, number>;
  /** The day's recommended portions for the target, and their kcal (null while unknown). */
  portions: PortionCounts | null;
  portionsKcal: number | null;
}

/** Step 1: her data and goal, the calculation as an equation, and the daily target. */
export function CalorieTargetSection({ target, onChange, suggestion, requestError, floorKcal, goalAdjustments, portions, portionsKcal }: CalorieTargetSectionProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const { overrides } = target;

  return (
    <section className="nb-card" id={sectionId('target')} aria-labelledby="nb-target-title">
      <header className="nb-card-head">
        <span className="nb-card-number" aria-hidden="true">1</span>
        <h2 className="nb-card-title" id="nb-target-title" tabIndex={-1}>
          {copy.builder.step1}
        </h2>
      </header>

      <HerDataFields
        inputs={suggestion?.inputs}
        overrides={overrides}
        formulaSex={target.formulaSex}
        onOverride={(key, value) => onChange({ overrides: { ...overrides, [key]: value ?? null } })}
        onFormulaSex={(formulaSex) => onChange({ formulaSex })}
        onReset={() => onChange({ overrides: { ...NO_OVERRIDES } })}
      />
      <GoalSegmented label={copy.builder.goalLabel} value={target.goal} adjustments={goalAdjustments} onChange={(goal) => onChange({ goal })} />

      {requestError && (
        <p className="nb-error" role="alert">
          {requestError}
        </p>
      )}
      {suggestion?.status === 'needs_formula' && <p className="nb-note">{copy.suggestionNeedsFormula}</p>}
      {suggestion?.status === 'missing_inputs' && (
        <p className="nb-note">{fill(copy.suggestionMissing, { fields: suggestion.missing.map((field) => copy.missing[field]).join(shared.common.listSeparator) })}</p>
      )}
      {suggestion?.status === 'ok' && suggestion.bmr !== null && suggestion.tdee !== null && <CalcEquation suggestion={suggestion} floorKcal={floorKcal} />}

      <DailyTarget target={target} suggestion={suggestion} floorKcal={floorKcal} portions={portions} portionsKcal={portionsKcal} onChange={onChange} />
    </section>
  );
}
