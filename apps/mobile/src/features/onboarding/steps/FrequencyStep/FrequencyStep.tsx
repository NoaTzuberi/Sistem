import { sharedCopy, useCopy } from '@sistem/shared';
import type { TrainingExperience } from '@sistem/types';
import { onboardingCopy } from '../../copy';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import type { OnboardingFormState } from '../../types';
import './FrequencyStep.css';

interface FrequencyStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
/** Phase 12b: optional, one choice (tap again to clear). Ids mirror TRAINING_EXPERIENCE_IDS on the server. */
const EXPERIENCE_OPTIONS: TrainingExperience[] = ['new', 'some', 'experienced'];

export function FrequencyStep({ formState, updateFormState }: FrequencyStepProps) {
  const { trainingFrequency } = formState;
  const copy = useCopy(onboardingCopy).frequency;
  const experienceLabels = useCopy(sharedCopy).onboardingOptions.trainingExperience;

  function setMinDays(day: number) {
    updateFormState({
      trainingFrequency: {
        ...trainingFrequency,
        minDays: day,
        maxDays: Math.max(day, trainingFrequency.maxDays),
      },
    });
  }

  function setMaxDays(day: number) {
    updateFormState({
      trainingFrequency: {
        ...trainingFrequency,
        maxDays: day,
        minDays: Math.min(day, trainingFrequency.minDays),
      },
    });
  }

  return (
    <div className="onboarding-step frequency-step">
      <h1>{copy.title}</h1>

      <div className="frequency-field">
        <span className="text-label">{copy.minDays}</span>
        <div className="frequency-options">
          {DAY_OPTIONS.map((day) => (
            <SelectableChip
              key={day}
              label={String(day)}
              selected={trainingFrequency.minDays === day}
              onClick={() => setMinDays(day)}
            />
          ))}
        </div>
      </div>

      <div className="frequency-field">
        <span className="text-label">{copy.maxDays}</span>
        <div className="frequency-options">
          {DAY_OPTIONS.map((day) => (
            <SelectableChip
              key={day}
              label={String(day)}
              selected={trainingFrequency.maxDays === day}
              onClick={() => setMaxDays(day)}
            />
          ))}
        </div>
      </div>

      <SelectableChip
        label={copy.flexible}
        selected={trainingFrequency.flexibleSchedule}
        onClick={() =>
          updateFormState({
            trainingFrequency: {
              ...trainingFrequency,
              flexibleSchedule: !trainingFrequency.flexibleSchedule,
            },
          })
        }
      />

      <div className="frequency-field">
        <span className="text-label">{copy.experienceLabel}</span>
        <div className="frequency-options">
          {EXPERIENCE_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              label={experienceLabels[option]}
              selected={formState.trainingExperience === option}
              onClick={() => updateFormState({ trainingExperience: formState.trainingExperience === option ? null : option })}
            />
          ))}
        </div>
      </div>

      <p className="text-caption frequency-note">{copy.note}</p>
    </div>
  );
}
