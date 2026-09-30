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
      <h1>Anything Sistem should consider?</h1>
      <p className="text-body">Optional.</p>

      <div className="recovery-flags">
        {RECOVERY_FLAG_OPTIONS.map((flag) => (
          <SelectableChip
            key={flag.id}
            label={flag.label}
            selected={recovery.flags.includes(flag.id)}
            onClick={() => toggleFlag(flag.id)}
          />
        ))}
      </div>

      {showNotes && (
        <Input
          label="Tell us anything helpful for adapting your training."
          value={recovery.notes}
          onChange={(event) => updateFormState({ recovery: { ...recovery, notes: event.target.value } })}
        />
      )}

      <p className="text-caption recovery-note">
        Sistem can adapt training suggestions, but it does not diagnose medical conditions.
      </p>
    </div>
  );
}
