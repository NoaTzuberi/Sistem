import { useEffect, useRef } from 'react';
import { IconCamera } from '@tabler/icons-react';
import { DeckButton } from '../../components/DeckButton/DeckButton';
import { useStartingPhotoUpload } from '../../../bodyTracking/hooks/useStartingPhotoUpload';
import { onboardingCopy } from '../../copy';
import { bodyCopy } from '../../../bodyTracking/copy';
import { useCopy } from '@sistem/shared';
import './StartingPhotoStep.css';

interface StartingPhotoStepProps {
  date: string;
  onPhotoSaved: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function StartingPhotoStep({ date, onPhotoSaved, onBusyChange }: StartingPhotoStepProps) {
  const copy = useCopy(onboardingCopy);
  const bodyText = useCopy(bodyCopy);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useStartingPhotoUpload(date, onPhotoSavedMetric);

  function onPhotoSavedMetric() {
    onPhotoSaved();
  }

  useEffect(() => onBusyChange(upload.busy !== null), [onBusyChange, upload.busy]);

  return (
    <div className="starting-photo-step">
      <p className="starting-photo-step-explanation">{copy.startingPhoto.explanation}</p>
      <DeckButton onClick={() => inputRef.current?.click()} disabled={upload.busy !== null}>
        <IconCamera size={19} aria-hidden="true" />
        {copy.startingPhoto.upload}
      </DeckButton>
      {upload.status && (
        <p className="starting-photo-step-status" role="status">
          {upload.status}
        </p>
      )}
      {upload.saved && <p className="starting-photo-step-status" role="status">{bodyText.startingPhotoSaved}</p>}
      {upload.error && (
        <div className="starting-photo-step-error" role="alert">
          <span>{upload.error}</span>
          {upload.canRetry && <DeckButton variant="quiet" onClick={upload.retry} disabled={upload.busy !== null}>
            {bodyText.retry}
          </DeckButton>}
        </div>
      )}
      <input
        ref={inputRef}
        className="starting-photo-step-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={upload.handlePicked}
      />
    </div>
  );
}
