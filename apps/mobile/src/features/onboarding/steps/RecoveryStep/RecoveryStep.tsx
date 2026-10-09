import { sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { SelectableChip } from '../../components/SelectableChip/SelectableChip';
import { Input } from '../../../../components/common/Input/Input';
import { RECOVERY_FLAG_OPTIONS } from '../../data/options';
import type { OnboardingFormState } from '../../types';
import './RecoveryStep.css';

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
    <div className="onboarding-step recovery-step">
      <h1>{copy.title}</h1>
      <p className="text-body">{copy.hint}</p>

      <div className="recovery-flags">
        {RECOVERY_FLAG_OPTIONS.map((flag) => (
          <SelectableChip
            key={flag.id}
            label={labels[flag.id]}
            selected={recovery.flags.includes(flag.id)}
            onClick={() => toggleFlag(flag.id)}
          />
        ))}
      </div>

      {showNotes && (
        <Input
          label={copy.notesLabel}
          dir="auto"
          enterKeyHint="done"
          value={recovery.notes}
          onChange={(event) => updateFormState({ recovery: { ...recovery, notes: event.target.value } })}
        />
      )}

      <p className="text-caption recovery-note">{copy.note}</p>
    </div>
  );
}
