import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { OptionList } from '../../components/OptionList/OptionList';
import { GOAL_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';

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
    <OptionList
      label={copy.goals.title}
      kind="multi"
      options={GOAL_OPTIONS.map((goal) => ({ id: goal.id, label: labels[goal.id] }))}
      selected={formState.goals}
      onToggle={toggleGoal}
    />
  );
}
