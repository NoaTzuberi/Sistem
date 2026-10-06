import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';
import './PhotoViewer.css';

interface PhotoViewerProps {
  src: string;
  alt: string;
  closeLabel: string;
  onClose: () => void;
}

/** One photo, full screen, on a dark overlay. Tap anywhere or Escape closes it. */
export function PhotoViewer({ src, alt, closeLabel, onClose }: PhotoViewerProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Portaled: the page-enter transform on <main> would pin a fixed overlay to <main>.
  return createPortal(
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button type="button" className="photo-viewer-close" aria-label={closeLabel} onClick={onClose}>
        <IconX size={24} aria-hidden="true" />
      </button>
      <img className="photo-viewer-image" src={src} alt={alt} />
    </div>,
    document.body,
  );
}
