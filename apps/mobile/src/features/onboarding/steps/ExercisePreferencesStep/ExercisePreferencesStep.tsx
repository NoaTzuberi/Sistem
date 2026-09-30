import { Autocomplete } from '../../../../components/common/Autocomplete/Autocomplete';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
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
    <div className="onboarding-step exercise-preferences-step">
      <h1>What would you like Sistem to prioritize?</h1>
      <p className="text-body">All answers are optional — you can edit this later.</p>

      <Autocomplete
        label="Exercises you enjoy"
        placeholder="e.g. Bench Press, Deadlift"
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
        label="Exercises you want to improve"
        placeholder="e.g. Pull-ups, Squats"
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
        <span className="text-label">Muscle groups you want to focus on</span>
        <div className="exercise-preferences-muscles-grid">
          {MUSCLE_FOCUS_OPTIONS.map((muscle) => (
            <SelectableChip
              key={muscle.id}
              label={muscle.label}
              selected={exercisePreferences.muscleFocus.includes(muscle.id)}
              onClick={() => toggleMuscle(muscle.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
