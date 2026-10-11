import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { Input } from '../../../../components/common/Input/Input';
import { Select } from '../../../../components/common/Select/Select';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import type { OnboardingFormState } from '../../types';
import './BasicProfileStep.css';

const GENDER_IDS = ['male', 'female', 'other'] as const;

interface BasicProfileStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function BasicProfileStep({ formState, updateFormState }: BasicProfileStepProps) {
  const copy = useCopy(onboardingCopy).basicProfile;
  const shared = useCopy(sharedCopy);
  const genderOptions = GENDER_IDS.map((value) => ({ value, label: shared.onboardingOptions.gender[value] }));
  return (
    <>
      <div className="basic-profile-fields">
        <Input
          label={copy.name}
          dir="auto"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          value={formState.name}
          onChange={(event) => updateFormState({ name: event.target.value })}
        />
        <Input
          label={copy.birthDate}
          type="date"
          autoComplete="bday"
          value={formState.birthDate}
          onChange={(event) => updateFormState({ birthDate: event.target.value })}
        />
        <Input
          label={copy.height}
          type="number"
          inputMode="decimal"
          enterKeyHint="next"
          value={formState.height}
          onChange={(event) => updateFormState({ height: event.target.value })}
        />
        <Input
          label={copy.weight}
          type="number"
          inputMode="decimal"
          enterKeyHint="done"
          value={formState.weight}
          onChange={(event) => updateFormState({ weight: event.target.value })}
        />
        <Select
          label={copy.gender}
          placeholder={copy.selectPlaceholder}
          value={formState.gender}
          onChange={(event) => updateFormState({ gender: event.target.value })}
          options={genderOptions}
        />
      </div>

      <div className="basic-profile-units">
        <span className="text-label">{copy.preferredUnits}</span>
        <div className="basic-profile-units-row">
          <SelectableChip
            label={shared.units.kg}
            selected={formState.units.weight === 'kg'}
            onClick={() => updateFormState({ units: { ...formState.units, weight: 'kg' } })}
          />
          <SelectableChip
            label={shared.units.lb}
            selected={formState.units.weight === 'lb'}
            onClick={() => updateFormState({ units: { ...formState.units, weight: 'lb' } })}
          />
          <SelectableChip
            label={shared.units.km}
            selected={formState.units.distance === 'km'}
            onClick={() => updateFormState({ units: { ...formState.units, distance: 'km' } })}
          />
          <SelectableChip
            label={shared.units.miles}
            selected={formState.units.distance === 'miles'}
            onClick={() => updateFormState({ units: { ...formState.units, distance: 'miles' } })}
          />
        </div>
      </div>
    </>
  );
}
