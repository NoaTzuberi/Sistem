import type { ActiveWorkoutRef } from '@sistem/types';
import { Modal } from '../../../../components/common/Modal/Modal';
import { Button } from '../../../../components/common/Button/Button';
import { SESSION_COPY } from '../../data/workoutCopy';
import './StartConflictModal.css';

interface StartConflictModalProps {
  active: ActiveWorkoutRef | null;
  isBusy: boolean;
  onClose: () => void;
  onResume: () => void;
  onDiscardAndStart: () => void;
}

/** Only one workout can be open: resume the open one, or discard it and start this one. */
export function StartConflictModal({ active, isBusy, onClose, onResume, onDiscardAndStart }: StartConflictModalProps) {
  return (
    <Modal isOpen={active !== null} onClose={onClose} variant="flat" title={SESSION_COPY.conflictTitle}>
      {active && (
        <div className="start-conflict">
          <p className="start-conflict-text">{SESSION_COPY.conflictText(active.workoutTitle)}</p>
          <Button onClick={onResume} disabled={isBusy}>
            {SESSION_COPY.conflictResume(active.workoutTitle)}
          </Button>
          <Button variant="danger" onClick={onDiscardAndStart} loading={isBusy}>
            {SESSION_COPY.conflictDiscardAndStart}
          </Button>
        </div>
      )}
    </Modal>
  );
}
