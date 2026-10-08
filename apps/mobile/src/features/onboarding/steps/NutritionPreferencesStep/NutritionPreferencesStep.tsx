import type { AllergyId, DietType } from '@sistem/types';
import { Input } from '../../../../components/common/Input/Input';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { ALLERGY_OPTIONS, DIET_TYPE_OPTIONS } from '../../data/options';
import { NUTRITION_PREFERENCES_COPY as COPY } from '../../data/nutritionPreferencesCopy';
import type { OnboardingFormState } from '../../types';
import './NutritionPreferencesStep.css';

// Phase 13a — the one owner-approved addition to the protected onboarding (PRD §5.6).
// Every answer is optional; "none / not kosher" is the starting point.

const MAX_TEXT_LENGTH = 500;

interface NutritionPreferencesStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function NutritionPreferencesStep({ formState, updateFormState }: NutritionPreferencesStepProps) {
  const preferences = formState.nutritionPreferences;

  function update(patch: Partial<OnboardingFormState['nutritionPreferences']>) {
    updateFormState({ nutritionPreferences: { ...preferences, ...patch } });
  }

  function toggleAllergy(id: AllergyId) {
    const selected = preferences.allergies.includes(id);
    update({ allergies: selected ? preferences.allergies.filter((allergy) => allergy !== id) : [...preferences.allergies, id] });
  }

  return (
    <div className="onboarding-step nutrition-preferences-step">
      <h1>{COPY.title}</h1>
      <p className="text-body">{COPY.intro}</p>

      <div className="nutrition-preferences-group">
        <span className="text-label">{COPY.dietLabel}</span>
        <div className="nutrition-preferences-chips">
          {DIET_TYPE_OPTIONS.map((option) => (
            <SelectableChip
              key={option.id}
              label={option.label}
              selected={preferences.dietType === option.id}
              onClick={() => update({ dietType: option.id as DietType })}
            />
          ))}
        </div>
      </div>

      <div className="nutrition-preferences-group">
        <span className="text-label">{COPY.kosherLabel}</span>
        <div className="nutrition-preferences-chips">
          <SelectableChip
            label={COPY.kosherNo}
            selected={!preferences.kosher}
            onClick={() => update({ kosher: false })}
          />
          <SelectableChip
            label={COPY.kosherYes}
            selected={preferences.kosher}
            onClick={() => update({ kosher: true })}
          />
        </div>
      </div>

      <div className="nutrition-preferences-group">
        <span className="text-label">{COPY.allergiesLabel}</span>
        <div className="nutrition-preferences-chips">
          {ALLERGY_OPTIONS.map((option) => (
            <SelectableChip
              key={option.id}
              label={option.label}
              selected={preferences.allergies.includes(option.id as AllergyId)}
              onClick={() => toggleAllergy(option.id as AllergyId)}
            />
          ))}
        </div>
      </div>

      <Input
        label={COPY.allergyNotesLabel}
        placeholder={COPY.allergyNotesPlaceholder}
        enterKeyHint="next"
        maxLength={MAX_TEXT_LENGTH}
        value={preferences.allergyNotes}
        onChange={(event) => update({ allergyNotes: event.target.value })}
      />

      <Input
        label={COPY.dislikesLabel}
        placeholder={COPY.dislikesPlaceholder}
        enterKeyHint="done"
        maxLength={MAX_TEXT_LENGTH}
        value={preferences.dislikes}
        onChange={(event) => update({ dislikes: event.target.value })}
      />

      <p className="text-caption nutrition-preferences-note">{COPY.privacyNote}</p>
    </div>
  );
}
