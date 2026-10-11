import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { Autocomplete } from '../../../../components/common/Autocomplete/Autocomplete';
import { OptionList } from '../../components/OptionList/OptionList';
import { MUSCLE_FOCUS_OPTIONS } from '../../data/options';
import { EXERCISE_BANK } from '../../data/exerciseBank';
import type { OnboardingFormState } from '../../types';
import './ExercisePreferencesStep.css';

interface ExercisePreferencesStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function ExercisePreferencesStep({
  formState,
  updateFormState,
}: ExercisePreferencesStepProps) {
  const copy = useCopy(onboardingCopy).exercisePreferences;
  const labels = useCopy(sharedCopy).onboardingOptions.muscleFocus;
  const { exercisePreferences } = formState;

  function toggleMuscle(id: string) {
    const isSelected = exercisePreferences.muscleFocus.includes(id);
    updateFormState({
      exercisePreferences: {
        ...exercisePreferences,
        muscleFocus: isSelected
          ? exercisePreferences.muscleFocus.filter((muscle) => muscle !== id)
          : [...exercisePreferences.muscleFocus, id],
      },
    });
  }

  return (
    <>
      <Autocomplete
        label={copy.enjoyLabel}
        placeholder={copy.enjoyPlaceholder}
        value={exercisePreferences.favoriteExerciseNotes}
        onChange={(value) =>
          updateFormState({
            exercisePreferences: {
              ...exercisePreferences,
              favoriteExerciseNotes: value,
            },
          })
        }
        options={EXERCISE_BANK}
      />

      <Autocomplete
        label={copy.improveLabel}
        placeholder={copy.improvePlaceholder}
        value={exercisePreferences.improvementExerciseNotes}
        onChange={(value) =>
          updateFormState({
            exercisePreferences: {
              ...exercisePreferences,
              improvementExerciseNotes: value,
            },
          })
        }
        options={EXERCISE_BANK}
      />

      <div className="exercise-preferences-muscles">
        <span className="text-label">{copy.muscleLabel}</span>
        <OptionList
          label={copy.muscleLabel}
          kind="multi"
          columns={2}
          options={MUSCLE_FOCUS_OPTIONS.map((muscle) => ({ id: muscle.id, label: labels[muscle.id] }))}
          selected={exercisePreferences.muscleFocus}
          onToggle={toggleMuscle}
        />
      </div>
    </>
  );
}
