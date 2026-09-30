import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import type { OnboardingFormState } from '../../types';
import './FrequencyStep.css';

interface FrequencyStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function FrequencyStep({ formState, updateFormState }: FrequencyStepProps) {
  const { trainingFrequency } = formState;

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
      <h1>How often would you like to train?</h1>

      <div className="frequency-field">
        <span className="text-label">Minimum days per week</span>
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
        <span className="text-label">Maximum days per week</span>
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
        label="My schedule changes week to week"
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

      <p className="text-caption frequency-note">
        Sistem can adapt recommendations when your available time changes.
      </p>
    </div>
  );
}
