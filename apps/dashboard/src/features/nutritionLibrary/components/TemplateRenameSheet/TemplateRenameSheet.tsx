import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useCopy } from '@sistem/shared';
import { SideSheet } from '../../../../components/common/SideSheet/SideSheet';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { nutritionLibraryCopy } from '../../copy';
import './TemplateRenameSheet.css';

// = the server's MAX_TEMPLATE_NAME_LENGTH.
const MAX_NAME_LENGTH = 80;

interface TemplateRenameSheetProps {
  isOpen: boolean;
  name: string;
  onClose: () => void;
  /** Resolves true when saved (the sheet then closes). */
  onSave: (name: string) => Promise<boolean>;
}

/** A new name for a template — nothing else of it changes. Mount it with a new key per opening. */
export function TemplateRenameSheet({ isOpen, name, onClose, onSave }: TemplateRenameSheetProps) {
  const copy = useCopy(nutritionLibraryCopy);
  const [value, setValue] = useState(name);
  const [isBusy, setIsBusy] = useState(false);
  const formId = useId();
  const isValid = value.trim() !== '' && value.trim() !== name;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValid || isBusy) return;
    setIsBusy(true);
    const saved = await onSave(value.trim());
    setIsBusy(false);
    if (saved) onClose();
  }

  const footer = (
    <div className="template-rename-footer">
      <PillButton variant="fill" onClick={onClose}>
        {copy.cancel}
      </PillButton>
      <PillButton className="template-rename-submit" variant="primary" type="submit" form={formId} aria-disabled={!isValid || isBusy}>
        {copy.renameSave}
      </PillButton>
    </div>
  );

  return (
    <SideSheet isOpen={isOpen} onClose={onClose} title={copy.renameTitle} footer={footer}>
      <form id={formId} className="template-rename" onSubmit={submit}>
        <label className="template-rename-field">
          <span className="template-rename-label">{copy.templateName}</span>
          <input
            className="template-rename-input"
            dir="auto"
            maxLength={MAX_NAME_LENGTH}
            value={value}
            data-autofocus
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      </form>
    </SideSheet>
  );
}
