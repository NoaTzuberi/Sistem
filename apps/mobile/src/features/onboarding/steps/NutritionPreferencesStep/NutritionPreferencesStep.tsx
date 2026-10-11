import { useState } from 'react';
import type { DietType } from '@sistem/types';
import { describeWeightGoal, fill, parseDecimalInput, sharedCopy, toKg, unitLabel, useCopy, useI18n } from '@sistem/shared';
import { Input } from '../../../../components/common/Input/Input';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { AccordionSection } from '../../components/AccordionSection/AccordionSection';
import { PreferenceItemsField } from '../../components/PreferenceItemsField/PreferenceItemsField';
import {
  ALLERGY_OPTIONS,
  DIET_STYLE_OPTIONS,
  DIET_TYPE_OPTIONS,
  INTOLERANCE_OPTIONS,
  MEALS_PER_DAY_OPTIONS,
  RELIGIOUS_OPTIONS,
} from '../../data/options';
import {
  MAX_DETAILS_LENGTH,
  MAX_FOOD_TEXT_LENGTH,
  asksWeightGoal,
  isGoalValid,
  summarizeSections,
  toWeightGoalPayload,
} from '../../data/nutritionForm';
import { onboardingCopy } from '../../copy';
import type { OnboardingFormState } from '../../types';
import './NutritionPreferencesStep.css';

// "Nutrition & goal" (Phase 13a, one step with sections since 13a+ — owner decision): the
// only addition to the protected onboarding. Every answer is optional (one Skip).

type SectionId = 'goal' | 'howIEat' | 'restrictions';

interface NutritionPreferencesStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

/** Tomorrow… two years ahead, as 'YYYY-MM-DD' (the server checks again). */
function dateBounds(): { min: string; max: string } {
  const day = 24 * 60 * 60 * 1000;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { min: iso(Date.now() + day), max: iso(Date.now() + 730 * day) };
}

export function NutritionPreferencesStep({ formState, updateFormState }: NutritionPreferencesStepProps) {
  const labels = useCopy(sharedCopy).nutrition;
  const { language } = useI18n();
  const copy = useCopy(onboardingCopy);
  const preferences = formState.nutritionPreferences;
  const goal = formState.weightGoal;
  const showGoal = asksWeightGoal(formState.goals);
  const unit = formState.units.weight;
  // "My goal" opens by default when it is asked; the other two start closed.
  const [open, setOpen] = useState<Set<SectionId>>(() => new Set(showGoal ? ['goal'] : []));

  function toggle(section: SectionId) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function update(patch: Partial<OnboardingFormState['nutritionPreferences']>) {
    updateFormState({ nutritionPreferences: { ...preferences, ...patch } });
  }

  function updateGoal(patch: Partial<OnboardingFormState['weightGoal']>) {
    updateFormState({ weightGoal: { ...goal, ...patch } });
  }

  function chooseDietType(dietType: DietType) {
    // Vegetarian / vegan / pescatarian: one at a time; tapping the chosen one clears it.
    update({ dietType: preferences.dietType === dietType ? 'none' : dietType, dietTypeDetails: '' });
  }

  const summaries = summarizeSections(preferences, language);
  const goalPayload = toWeightGoalPayload(goal);
  const goalSummary =
    goalPayload && isGoalValid(goal)
      ? describeWeightGoal({ targetWeightKg: toKg(goalPayload.targetWeight, unit), timeframe: goalPayload.timeframe }, unit, language)
      : copy.nutrition.notAnswered;
  const currentWeight = parseDecimalInput(formState.weight);
  const bounds = dateBounds();
  const noDiet = preferences.dietType === 'none' && preferences.dietStyles.length === 0;
  const dietTypeLabel = preferences.dietType !== 'none' ? labels.dietTypes[preferences.dietType] : undefined;

  return (
    <div className="nutrition-preferences-step">
      {showGoal && (
        <AccordionSection title={copy.nutrition.goalTitle} summary={goalSummary} isOpen={open.has('goal')} onToggle={() => toggle('goal')}>
          {currentWeight !== null && (
            <p className="nutrition-preferences-current">
              {copy.nutrition.currentWeight} <strong>{`${currentWeight} ${unitLabel(unit, language)}`}</strong>
            </p>
          )}
          <Input
            label={`${copy.nutrition.targetWeight} (${unitLabel(unit, language)})`}
            inputMode="decimal"
            enterKeyHint="done"
            value={goal.targetWeight}
            error={isGoalValid(goal) ? undefined : copy.nutrition.goalInvalid}
            onChange={(event) => updateGoal({ targetWeight: event.target.value })}
          />
          <div className="nutrition-preferences-group">
            <span className="text-label">{copy.nutrition.byWhen}</span>
            <div className="nutrition-preferences-chips">
              <SelectableChip
                label={copy.nutrition.inWeeks}
                selected={goal.timeframeKind === 'weeks'}
                onClick={() => updateGoal({ timeframeKind: goal.timeframeKind === 'weeks' ? null : 'weeks' })}
              />
              <SelectableChip
                label={copy.nutrition.byDate}
                selected={goal.timeframeKind === 'date'}
                onClick={() => updateGoal({ timeframeKind: goal.timeframeKind === 'date' ? null : 'date' })}
              />
            </div>
          </div>
          {goal.timeframeKind === 'weeks' && (
            <Input
              label={copy.nutrition.weeks}
              inputMode="numeric"
              enterKeyHint="done"
              value={goal.weeks}
              onChange={(event) => updateGoal({ weeks: event.target.value.replace(/\D/g, '') })}
            />
          )}
          {goal.timeframeKind === 'date' && (
            <Input
              label={copy.nutrition.date}
              type="date"
              min={bounds.min}
              max={bounds.max}
              value={goal.date}
              onChange={(event) => updateGoal({ date: event.target.value })}
            />
          )}
        </AccordionSection>
      )}

      <AccordionSection
        title={copy.nutrition.howIEatTitle}
        summary={summaries.howIEat || copy.nutrition.notAnswered}
        isOpen={open.has('howIEat')}
        onToggle={() => toggle('howIEat')}
      >
        {/* One "Diet style" group: veg / vegan / pescatarian (one at a time) + combinable styles. */}
        <div className="nutrition-preferences-group">
          <span className="text-label">{copy.nutrition.dietLabel}</span>
          <div className="nutrition-preferences-chips">
            <SelectableChip label={copy.nutrition.dietNone} selected={noDiet} onClick={() => update({ dietType: 'none', dietTypeDetails: '', dietStyles: [] })} />
            {DIET_TYPE_OPTIONS.map((option) => (
              <SelectableChip
                key={option}
                label={labels.dietTypes[option]}
                selected={preferences.dietType === option}
                onClick={() => chooseDietType(option)}
              />
            ))}
          </div>
          <PreferenceItemsField
            label={copy.nutrition.dietLabel}
            hideLabel
            options={DIET_STYLE_OPTIONS}
            labels={labels.dietStyles}
            items={preferences.dietStyles}
            onChange={(dietStyles) => update({ dietStyles })}
          />
          {dietTypeLabel && (
            <Input
              label={fill(copy.nutrition.detailsLabel, { label: dietTypeLabel })}
              placeholder={copy.nutrition.detailsPlaceholder}
              maxLength={MAX_DETAILS_LENGTH}
              enterKeyHint="done"
              dir="auto"
              value={preferences.dietTypeDetails}
              onChange={(event) => update({ dietTypeDetails: event.target.value })}
            />
          )}
        </div>
        <PreferenceItemsField
          label={copy.nutrition.religiousLabel}
          options={RELIGIOUS_OPTIONS}
          labels={labels.religious}
          items={preferences.religious}
          onChange={(religious) => update({ religious })}
        />

        <div className="nutrition-preferences-group">
          <span className="text-label">{copy.nutrition.mealsLabel}</span>
          <div className="nutrition-preferences-chips">
            {MEALS_PER_DAY_OPTIONS.map((count) => (
              <SelectableChip
                key={count}
                className="nutrition-preferences-count"
                label={String(count)}
                selected={preferences.mealsPerDay === count}
                onClick={() => update({ mealsPerDay: preferences.mealsPerDay === count ? null : count })}
              />
            ))}
            <SelectableChip
              label={copy.nutrition.mealsNoPreference}
              selected={preferences.mealsPerDay === null}
              onClick={() => update({ mealsPerDay: null })}
            />
          </div>
        </div>

        <Input
          label={copy.nutrition.foodsLovedLabel}
          placeholder={copy.nutrition.foodsLovedPlaceholder}
          maxLength={MAX_FOOD_TEXT_LENGTH}
          enterKeyHint="next"
          dir="auto"
          value={preferences.foodsLoved}
          onChange={(event) => update({ foodsLoved: event.target.value })}
        />
        <Input
          label={copy.nutrition.foodsDislikedLabel}
          placeholder={copy.nutrition.foodsDislikedPlaceholder}
          maxLength={MAX_FOOD_TEXT_LENGTH}
          enterKeyHint="done"
          dir="auto"
          value={preferences.foodsDisliked}
          onChange={(event) => update({ foodsDisliked: event.target.value })}
        />
      </AccordionSection>

      <AccordionSection
        title={copy.nutrition.restrictionsTitle}
        summary={summaries.restrictions || copy.nutrition.none}
        isOpen={open.has('restrictions')}
        onToggle={() => toggle('restrictions')}
      >
        <PreferenceItemsField
          label={copy.nutrition.intolerancesLabel}
          options={INTOLERANCE_OPTIONS}
          labels={labels.intolerances}
          items={preferences.intolerances}
          onChange={(intolerances) => update({ intolerances })}
        />
        <PreferenceItemsField
          label={copy.nutrition.allergiesLabel}
          options={ALLERGY_OPTIONS}
          labels={labels.allergies}
          items={preferences.allergies}
          onChange={(allergies) => update({ allergies })}
        />
      </AccordionSection>

      <p className="text-caption">{copy.nutrition.privacyNote}</p>
    </div>
  );
}
