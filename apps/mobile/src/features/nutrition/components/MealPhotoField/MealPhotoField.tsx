import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import type { MealLogDay, MealPhoto } from '@sistem/types';
import { IconCamera, IconPhoto } from '@tabler/icons-react';
import { Button } from '../../../../components/common/Button/Button';
import { PrivatePhoto } from '../../../../components/common/PrivatePhoto/PrivatePhoto';
import { removeMealPhoto, uploadMealPhoto } from '../../../../services/nutrition/nutritionService';
import { PhotoTooLargeError, compressPhoto } from '../../../privatePhotos/data/photoCompression';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './MealPhotoField.css';

type Busy = { kind: 'preparing' } | { kind: 'uploading'; percent: number } | { kind: 'removing' } | null;

interface MealPhotoFieldProps {
  date: string;
  mealId: string;
  mealName: string;
  photo: MealPhoto | undefined;
  /** Past the 7-day window: the photo is shown, not changed. */
  editable: boolean;
  onDayChange: (day: MealLogDay) => void;
  /** The signed link expired while the screen was open: fetch the days again. */
  onLinkExpired: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof PhotoTooLargeError) return NUTRITION_COPY.photoTooLarge;
  if (axios.isAxiosError(error)) {
    if (!error.response) return NUTRITION_COPY.photoOffline;
    if (error.response.status === 413) return NUTRITION_COPY.photoTooLarge;
    return NUTRITION_COPY.photoError;
  }
  return NUTRITION_COPY.photoReadError;
}

/**
 * "Show off your meal" (13a+): one optional photo per meal per day — compressed on the
 * phone, uploaded as a private photo (only she and her coach see it, 1-hour links).
 * Photos need a connection; marks don't.
 */
export function MealPhotoField({ date, mealId, mealName, photo, editable, onDayChange, onLinkExpired }: MealPhotoFieldProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [localSrc, setLocalSrc] = useState<string | null>(null);

  useEffect(() => () => {
    if (localSrc) URL.revokeObjectURL(localSrc);
  }, [localSrc]);

  // Another day picked: forget this one's local preview.
  useEffect(() => {
    setLocalSrc(null);
    setError(null);
  }, [date]);

  async function handlePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setBusy({ kind: 'preparing' });
    try {
      const compressed = await compressPhoto(file);
      setBusy({ kind: 'uploading', percent: 0 });
      const day = await uploadMealPhoto(date, mealId, compressed, (fraction) =>
        setBusy({ kind: 'uploading', percent: Math.round(fraction * 100) }),
      );
      setLocalSrc(URL.createObjectURL(compressed));
      onDayChange(day);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy({ kind: 'removing' });
    try {
      onDayChange(await removeMealPhoto(date, mealId));
      setLocalSrc(null);
    } catch (caught) {
      setError(axios.isAxiosError(caught) && !caught.response ? NUTRITION_COPY.photoOffline : NUTRITION_COPY.photoRemoveError);
    } finally {
      setBusy(null);
    }
  }

  if (!editable && !photo) return null;
  const status =
    busy?.kind === 'preparing' ? NUTRITION_COPY.photoPreparing : busy?.kind === 'uploading' ? NUTRITION_COPY.photoUploading(busy.percent) : null;

  return (
    <div className="meal-photo-field">
      {photo && (
        <div className="meal-photo-field-photo">
          <PrivatePhoto
            photo={photo}
            localSrc={localSrc ?? undefined}
            alt={NUTRITION_COPY.photoAlt(mealName)}
            openLabel={NUTRITION_COPY.photoOpen}
            closeLabel={NUTRITION_COPY.photoClose}
            onLinkExpired={onLinkExpired}
            thumbnail
          />
        </div>
      )}
      {editable && (
        <>
          {!photo && <span className="meal-photo-field-label">{NUTRITION_COPY.photoAdd}</span>}
          <div className="meal-photo-field-actions">
            <Button variant="secondary" icon={<IconCamera size={18} aria-hidden="true" />} onClick={() => cameraRef.current?.click()} disabled={busy !== null}>
              {NUTRITION_COPY.photoCamera}
            </Button>
            <Button variant="secondary" icon={<IconPhoto size={18} aria-hidden="true" />} onClick={() => galleryRef.current?.click()} disabled={busy !== null}>
              {NUTRITION_COPY.photoGallery}
            </Button>
            {photo && (
              <Button variant="ghost" onClick={() => void handleRemove()} loading={busy?.kind === 'removing'} disabled={busy !== null}>
                {NUTRITION_COPY.photoRemove}
              </Button>
            )}
          </div>
        </>
      )}
      {status && (
        <p className="meal-photo-field-status" role="status">
          {status}
        </p>
      )}
      {error && (
        <p className="meal-photo-field-error" role="alert">
          {error}
        </p>
      )}
      <p className="meal-photo-field-privacy">{NUTRITION_COPY.photoPrivacy}</p>
      {/* `capture` opens the camera directly; without it the phone offers its photo library. */}
      <input ref={cameraRef} className="meal-photo-field-input" type="file" accept="image/*" capture onChange={handlePicked} />
      <input ref={galleryRef} className="meal-photo-field-input" type="file" accept="image/*" onChange={handlePicked} />
    </div>
  );
}
