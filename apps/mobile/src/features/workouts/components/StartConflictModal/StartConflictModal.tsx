import { fill, useCopy } from '@sistem/shared';
import type { ActiveWorkoutRef } from '@sistem/types';
import { Modal } from '../../../../components/common/Modal/Modal';
import { Button } from '../../../../components/common/Button/Button';
import { workoutCopy } from '../../copy';
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
  const copy = useCopy(workoutCopy);
  return (
    <Modal isOpen={active !== null} onClose={onClose} variant="flat" title={copy.session.conflictTitle}>
      {active && (
        <div className="start-conflict">
          <p className="start-conflict-text">{fill(copy.session.conflictText, { title: active.workoutTitle })}</p>
          <Button onClick={onResume} disabled={isBusy}>
            {fill(copy.session.conflictResume, { title: active.workoutTitle })}
          </Button>
          <Button variant="danger" onClick={onDiscardAndStart} loading={isBusy}>
            {copy.session.conflictDiscardAndStart}
          </Button>
        </div>
      )}
    </Modal>
  );
}
