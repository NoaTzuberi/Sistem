import { IconX } from '@tabler/icons-react';
import { useCopy } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { homeCopy } from '../../copy';
import './StartingPhotoReminder.css';

interface StartingPhotoReminderProps {
  onAdd: () => void;
  onDismiss: () => void;
}

export function StartingPhotoReminder({ onAdd, onDismiss }: StartingPhotoReminderProps) {
  const copy = useCopy(homeCopy);
  return (
    <aside className="starting-photo-reminder">
      <p className="starting-photo-reminder-text">{copy.startingPhotoReminder}</p>
      <Button onClick={onAdd}>{copy.addStartingPhoto}</Button>
      <button
        type="button"
        className="starting-photo-reminder-dismiss"
        aria-label={copy.dismissStartingPhotoReminder}
        onClick={onDismiss}
      >
        <IconX size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
