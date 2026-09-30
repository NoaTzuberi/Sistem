import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { GOAL_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';
import './GoalsStep.css';

interface GoalsStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function GoalsStep({ formState, updateFormState }: GoalsStepProps) {
  function toggleGoal(id: string) {
    const isSelected = formState.goals.includes(id);
    updateFormState({
      goals: isSelected ? formState.goals.filter((goal) => goal !== id) : [...formState.goals, id],
    });
  }

  return (
    <div className="onboarding-step goals-step">
      <h1>What are you working toward?</h1>
      <p className="text-body">Choose all that apply.</p>
      <div className="goals-grid">
        {GOAL_OPTIONS.map((goal) => (
          <SelectableChip
            key={goal.id}
            label={goal.label}
            emoji={goal.emoji}
            selected={formState.goals.includes(goal.id)}
            onClick={() => toggleGoal(goal.id)}
          />
        ))}
      </div>
    </div>
  );
}
