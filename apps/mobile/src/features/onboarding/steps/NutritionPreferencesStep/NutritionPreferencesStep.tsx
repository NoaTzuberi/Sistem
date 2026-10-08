import { useState } from 'react';
import type { DietType } from '@sistem/types';
import { describeWeightGoal, parseDecimalInput, toKg } from '@sistem/shared';
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
import { NUTRITION_PREFERENCES_COPY as COPY } from '../../data/nutritionPreferencesCopy';
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

  const summaries = summarizeSections(preferences);
  const goalPayload = toWeightGoalPayload(goal);
  const goalSummary =
    goalPayload && isGoalValid(goal)
      ? describeWeightGoal({ targetWeightKg: toKg(goalPayload.targetWeight, unit), timeframe: goalPayload.timeframe }, unit)
      : COPY.notAnswered;
  const currentWeight = parseDecimalInput(formState.weight);
  const bounds = dateBounds();
  const noDiet = preferences.dietType === 'none' && preferences.dietStyles.length === 0;
  const dietTypeLabel = DIET_TYPE_OPTIONS.find((option) => option.id === preferences.dietType)?.label;

  return (
    <div className="onboarding-step nutrition-preferences-step">
      <h1>{COPY.title}</h1>
      <p className="text-body">{COPY.intro}</p>

      {showGoal && (
        <AccordionSection title={COPY.goalTitle} summary={goalSummary} isOpen={open.has('goal')} onToggle={() => toggle('goal')}>
          {currentWeight !== null && (
            <p className="nutrition-preferences-current">
              {COPY.currentWeight} <strong>{`${currentWeight} ${unit}`}</strong>
            </p>
          )}
          <Input
            label={`${COPY.targetWeight} (${unit})`}
            inputMode="decimal"
            enterKeyHint="done"
            value={goal.targetWeight}
            error={isGoalValid(goal) ? undefined : COPY.goalInvalid}
            onChange={(event) => updateGoal({ targetWeight: event.target.value })}
          />
          <div className="nutrition-preferences-group">
            <span className="text-label">{COPY.byWhen}</span>
            <div className="nutrition-preferences-chips">
              <SelectableChip
                label={COPY.inWeeks}
                selected={goal.timeframeKind === 'weeks'}
                onClick={() => updateGoal({ timeframeKind: goal.timeframeKind === 'weeks' ? null : 'weeks' })}
              />
              <SelectableChip
                label={COPY.byDate}
                selected={goal.timeframeKind === 'date'}
                onClick={() => updateGoal({ timeframeKind: goal.timeframeKind === 'date' ? null : 'date' })}
              />
            </div>
          </div>
          {goal.timeframeKind === 'weeks' && (
            <Input
              label={COPY.weeks}
              inputMode="numeric"
              enterKeyHint="done"
              value={goal.weeks}
              onChange={(event) => updateGoal({ weeks: event.target.value.replace(/\D/g, '') })}
            />
          )}
          {goal.timeframeKind === 'date' && (
            <Input
              label={COPY.date}
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
        title={COPY.howIEatTitle}
        summary={summaries.howIEat || COPY.notAnswered}
        isOpen={open.has('howIEat')}
        onToggle={() => toggle('howIEat')}
      >
        {/* One "Diet style" group: veg / vegan / pescatarian (one at a time) + combinable styles. */}
        <div className="nutrition-preferences-group">
          <span className="text-label">{COPY.dietLabel}</span>
          <div className="nutrition-preferences-chips">
            <SelectableChip label={COPY.dietNone} selected={noDiet} onClick={() => update({ dietType: 'none', dietTypeDetails: '', dietStyles: [] })} />
            {DIET_TYPE_OPTIONS.map((option) => (
              <SelectableChip
                key={option.id}
                label={option.label}
                selected={preferences.dietType === option.id}
                onClick={() => chooseDietType(option.id)}
              />
            ))}
          </div>
          <PreferenceItemsField
            label={COPY.dietLabel}
            hideLabel
            options={DIET_STYLE_OPTIONS}
            items={preferences.dietStyles}
            onChange={(dietStyles) => update({ dietStyles })}
          />
          {dietTypeLabel && (
            <Input
              label={COPY.detailsLabel(dietTypeLabel)}
              placeholder={COPY.detailsPlaceholder}
              maxLength={MAX_DETAILS_LENGTH}
              enterKeyHint="done"
              dir="auto"
              value={preferences.dietTypeDetails}
              onChange={(event) => update({ dietTypeDetails: event.target.value })}
            />
          )}
        </div>
        <PreferenceItemsField
          label={COPY.religiousLabel}
          options={RELIGIOUS_OPTIONS}
          items={preferences.religious}
          onChange={(religious) => update({ religious })}
        />

        <div className="nutrition-preferences-group">
          <span className="text-label">{COPY.mealsLabel}</span>
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
              label={COPY.mealsNoPreference}
              selected={preferences.mealsPerDay === null}
              onClick={() => update({ mealsPerDay: null })}
            />
          </div>
        </div>

        <Input
          label={COPY.foodsLovedLabel}
          placeholder={COPY.foodsLovedPlaceholder}
          maxLength={MAX_FOOD_TEXT_LENGTH}
          enterKeyHint="next"
          dir="auto"
          value={preferences.foodsLoved}
          onChange={(event) => update({ foodsLoved: event.target.value })}
        />
        <Input
          label={COPY.foodsDislikedLabel}
          placeholder={COPY.foodsDislikedPlaceholder}
          maxLength={MAX_FOOD_TEXT_LENGTH}
          enterKeyHint="done"
          dir="auto"
          value={preferences.foodsDisliked}
          onChange={(event) => update({ foodsDisliked: event.target.value })}
        />
      </AccordionSection>

      <AccordionSection
        title={COPY.restrictionsTitle}
        summary={summaries.restrictions || COPY.none}
        isOpen={open.has('restrictions')}
        onToggle={() => toggle('restrictions')}
      >
        <PreferenceItemsField
          label={COPY.intolerancesLabel}
          options={INTOLERANCE_OPTIONS}
          items={preferences.intolerances}
          onChange={(intolerances) => update({ intolerances })}
        />
        <PreferenceItemsField
          label={COPY.allergiesLabel}
          options={ALLERGY_OPTIONS}
          items={preferences.allergies}
          onChange={(allergies) => update({ allergies })}
        />
      </AccordionSection>

      <p className="text-caption nutrition-preferences-note">{COPY.privacyNote}</p>
    </div>
  );
}
