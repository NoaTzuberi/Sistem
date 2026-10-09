import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { GOAL_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';
import './GoalsStep.css';

interface GoalsStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function GoalsStep({ formState, updateFormState }: GoalsStepProps) {
  const copy = useCopy(onboardingCopy);
  const labels = useCopy(sharedCopy).onboardingOptions.goals;
  function toggleGoal(id: string) {
    const isSelected = formState.goals.includes(id);
    updateFormState({
      goals: isSelected ? formState.goals.filter((goal) => goal !== id) : [...formState.goals, id],
    });
  }

  return (
    <div className="onboarding-step goals-step">
      <h1>{copy.goals.title}</h1>
      <p className="text-body">{copy.chooseAll}</p>
      <div className="goals-grid">
        {GOAL_OPTIONS.map((goal) => (
          <SelectableChip
            key={goal.id}
            label={labels[goal.id]}
            emoji={goal.emoji}
            selected={formState.goals.includes(goal.id)}
            onClick={() => toggleGoal(goal.id)}
          />
        ))}
      </div>
    </div>
  );
}
