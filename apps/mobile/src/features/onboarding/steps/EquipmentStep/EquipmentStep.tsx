import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { EQUIPMENT_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';
import './EquipmentStep.css';

interface EquipmentStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function EquipmentStep({ formState, updateFormState }: EquipmentStepProps) {
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
      <h1>What equipment can you use?</h1>
      <p className="text-body">Choose all that apply.</p>
      <div className="equipment-grid">
        {EQUIPMENT_OPTIONS.map((equipment) => (
          <SelectableChip
            key={equipment.id}
            label={equipment.label}
            emoji={equipment.emoji}
            selected={formState.equipment.includes(equipment.id)}
            onClick={() => toggleEquipment(equipment.id)}
          />
        ))}
      </div>
    </div>
  );
}
