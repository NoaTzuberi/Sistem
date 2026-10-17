import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { nutritionLibraryCopy } from '../../copy';
import './UnsavedChangesBar.css';

interface UnsavedChangesBarProps {
  canSave: boolean;
  /** Why save is blocked (the split isn't 100), shown instead of "unsaved changes". */
  blockedReason?: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/** A sticky glass bar that slides up while the settings have unsaved changes. */
export function UnsavedChangesBar({ canSave, blockedReason, isSaving, onCancel, onSave }: UnsavedChangesBarProps) {
  const copy = useCopy(nutritionLibraryCopy);
  return (
    <div className="unsaved-bar" role="region" aria-label={copy.unsaved}>
      <p className={blockedReason ? 'unsaved-bar-text unsaved-bar-text-blocked' : 'unsaved-bar-text'} role="status">
        <Icon name="alert" size="sm" />
        {blockedReason ?? copy.unsaved}
      </p>
      <PillButton variant="fill" onClick={onCancel} disabled={isSaving}>
        {copy.cancel}
      </PillButton>
      <PillButton variant="primary" onClick={onSave} aria-disabled={!canSave || isSaving}>
        {copy.saveSettings}
      </PillButton>
    </div>
  );
}
