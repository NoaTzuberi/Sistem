import type { SaveStatus } from '../../hooks/usePlanEditor';
import './SaveIndicator.css';

const LABELS: Record<SaveStatus, string> = {
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Not saved',
};

interface SaveIndicatorProps {
  status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  return (
    <span className={`save-indicator save-indicator-${status}`} role="status">
      {LABELS[status]}
    </span>
  );
}
