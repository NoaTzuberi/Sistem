import { useState } from 'react';
import type { PrivatePhoto as PrivatePhotoData } from '@sistem/types';
import { PhotoViewer } from '../PhotoViewer/PhotoViewer';
import './PrivatePhoto.css';

interface PrivatePhotoProps {
  photo: PrivatePhotoData;
  alt: string;
  openLabel: string;
  closeLabel: string;
  /** Shown instead of the signed link (e.g. the photo just picked, before a refetch). */
  localSrc?: string;
  /**
   * The signed link stops working after an hour: called once per link when the image
   * fails, so the screen can fetch the log again for a fresh one.
   */
  onLinkExpired?: () => void;
  /** A fixed 3:4 tile, cropped (galleries); the full photo opens on tap. */
  thumbnail?: boolean;
}

/** A private photo (signed link only) that opens full screen on tap. */
export function PrivatePhoto({ photo, alt, openLabel, closeLabel, localSrc, onLinkExpired, thumbnail = false }: PrivatePhotoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = localSrc ?? photo.url;

  function handleError() {
    if (localSrc || failedUrl === photo.url) return;
    setFailedUrl(photo.url);
    onLinkExpired?.();
  }

  return (
    <>
      <button
        type="button"
        className={'private-photo' + (thumbnail ? ' private-photo-thumbnail' : '')}
        aria-label={openLabel}
        onClick={() => setIsOpen(true)}
      >
        <img className="private-photo-image" src={src} alt={alt} loading="lazy" onError={handleError} />
      </button>
      {isOpen && <PhotoViewer src={src} alt={alt} closeLabel={closeLabel} onClose={() => setIsOpen(false)} />}
    </>
  );
}
