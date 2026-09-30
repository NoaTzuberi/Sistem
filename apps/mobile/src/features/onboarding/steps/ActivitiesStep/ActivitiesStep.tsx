import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { ACTIVITIES, ACTIVITY_CATEGORIES } from '../../data/activities';
import type { OnboardingFormState } from '../../types';
import './ActivitiesStep.css';

interface ActivitiesStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
  onPreviewActivity: (id: string) => void;
}

export function ActivitiesStep({ formState, updateFormState, onPreviewActivity }: ActivitiesStepProps) {
  function toggleActivity(id: string) {
    const isSelected = formState.preferredActivities.includes(id);
    updateFormState({
      preferredActivities: isSelected
        ? formState.preferredActivities.filter((activity) => activity !== id)
        : [...formState.preferredActivities, id],
    });
    onPreviewActivity(id);
  }

  return (
    <div className="onboarding-step activities-step">
      <h1>What activities are part of your life?</h1>
      <p className="text-body">Choose all that apply.</p>

      {ACTIVITY_CATEGORIES.map((category) => (
        <div key={category.id} className="activities-category">
          <span className="text-label">{category.label}</span>
          <div className="activities-grid">
            {ACTIVITIES.filter((activity) => activity.category === category.id).map((activity) => (
              <SelectableChip
                key={activity.id}
                label={activity.label}
                emoji={activity.emoji}
                selected={formState.preferredActivities.includes(activity.id)}
                onClick={() => toggleActivity(activity.id)}
                onMouseEnter={() => onPreviewActivity(activity.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
