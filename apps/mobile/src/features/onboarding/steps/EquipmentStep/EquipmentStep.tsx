import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { OptionList } from '../../components/OptionList/OptionList';
import { EQUIPMENT_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';

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
    <OptionList
      label={copy.equipment.title}
      kind="multi"
      columns={2}
      options={EQUIPMENT_OPTIONS.map((equipment) => ({ id: equipment.id, label: labels[equipment.id] }))}
      selected={formState.equipment}
      onToggle={toggleEquipment}
    />
  );
}
