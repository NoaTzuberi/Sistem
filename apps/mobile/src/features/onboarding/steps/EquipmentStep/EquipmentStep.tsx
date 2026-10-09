import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { EQUIPMENT_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';
import './EquipmentStep.css';

interface EquipmentStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function EquipmentStep({ formState, updateFormState }: EquipmentStepProps) {
  const copy = useCopy(onboardingCopy);
  const labels = useCopy(sharedCopy).onboardingOptions.equipment;
  function toggleEquipment(id: string) {
    const isSelected = formState.equipment.includes(id);
    updateFormState({
      equipment: isSelected
        ? formState.equipment.filter((item) => item !== id)
        : [...formState.equipment, id],
    });
  }

  return (
    <div className="onboarding-step equipment-step">
      <h1>{copy.equipment.title}</h1>
      <p className="text-body">{copy.chooseAll}</p>
      <div className="equipment-grid">
        {EQUIPMENT_OPTIONS.map((equipment) => (
          <SelectableChip
            key={equipment.id}
            label={labels[equipment.id]}
            emoji={equipment.emoji}
            selected={formState.equipment.includes(equipment.id)}
            onClick={() => toggleEquipment(equipment.id)}
          />
        ))}
      </div>
    </div>
  );
}
