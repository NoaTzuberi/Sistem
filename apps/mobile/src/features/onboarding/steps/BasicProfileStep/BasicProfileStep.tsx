import { Input } from '../../../../components/common/Input/Input';
import { Select } from '../../../../components/common/Select/Select';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import type { OnboardingFormState } from '../../types';
import './BasicProfileStep.css';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

interface BasicProfileStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function BasicProfileStep({ formState, updateFormState }: BasicProfileStepProps) {
  return (
    <div className="onboarding-step basic-profile-step">
      <h1>Let&apos;s start with you.</h1>

      <div className="basic-profile-fields">
        <Input
          label="Name"
          value={formState.name}
          onChange={(event) => updateFormState({ name: event.target.value })}
        />
        <Input
          label="Birth Date"
          type="date"
          value={formState.birthDate}
          onChange={(event) => updateFormState({ birthDate: event.target.value })}
        />
        <Input
          label="Height (cm)"
          type="number"
          value={formState.height}
          onChange={(event) => updateFormState({ height: event.target.value })}
        />
        <Input
          label="Weight"
          type="number"
          value={formState.weight}
          onChange={(event) => updateFormState({ weight: event.target.value })}
        />
        <Select
          label="Gender (optional)"
          placeholder="Select..."
          value={formState.gender}
          onChange={(event) => updateFormState({ gender: event.target.value })}
          options={GENDER_OPTIONS}
        />
      </div>

      <div className="basic-profile-units">
        <span className="text-label">Preferred units</span>
        <div className="basic-profile-units-row">
          <SelectableChip
            label="kg"
            selected={formState.units.weight === 'kg'}
            onClick={() => updateFormState({ units: { ...formState.units, weight: 'kg' } })}
          />
          <SelectableChip
            label="lb"
            selected={formState.units.weight === 'lb'}
            onClick={() => updateFormState({ units: { ...formState.units, weight: 'lb' } })}
          />
          <SelectableChip
            label="km"
            selected={formState.units.distance === 'km'}
            onClick={() => updateFormState({ units: { ...formState.units, distance: 'km' } })}
          />
          <SelectableChip
            label="miles"
            selected={formState.units.distance === 'miles'}
            onClick={() => updateFormState({ units: { ...formState.units, distance: 'miles' } })}
          />
        </div>
      </div>
    </div>
  );
}
