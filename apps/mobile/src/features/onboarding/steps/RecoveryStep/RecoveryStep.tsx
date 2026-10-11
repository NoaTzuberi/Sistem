import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { OptionList } from '../../components/OptionList/OptionList';
import { Input } from '../../../../components/common/Input/Input';
import { RECOVERY_FLAG_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';

interface RecoveryStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
}

export function RecoveryStep({ formState, updateFormState }: RecoveryStepProps) {
  const copy = useCopy(onboardingCopy).recovery;
  const labels = useCopy(sharedCopy).onboardingOptions.recoveryFlags;
  const { recovery } = formState;

  function toggleFlag(id: string) {
    const isSelected = recovery.flags.includes(id);
    updateFormState({
      recovery: {
        ...recovery,
        flags: isSelected ? recovery.flags.filter((flag) => flag !== id) : [...recovery.flags, id],
      },
    });
  }

  const showNotes = recovery.flags.includes('has_injury_or_limitation');

  return (
    <>
      <OptionList
        label={copy.title}
        kind="multi"
        options={RECOVERY_FLAG_OPTIONS.map((flag) => ({ id: flag.id, label: labels[flag.id] }))}
        selected={recovery.flags}
        onToggle={toggleFlag}
      />

      {showNotes && (
        <Input
          label={copy.notesLabel}
          dir="auto"
          enterKeyHint="done"
          value={recovery.notes}
          onChange={(event) => updateFormState({ recovery: { ...recovery, notes: event.target.value } })}
        />
      )}

      <p className="text-caption">{copy.note}</p>
    </>
  );
}
