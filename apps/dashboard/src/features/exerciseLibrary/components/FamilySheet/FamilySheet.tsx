import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useCopy } from '@sistem/shared';
import { useDrawerTransition } from '../../../../hooks/useDrawerTransition';
import { exerciseLibraryCopy } from '../../copy';
import './FamilySheet.css';

// = --transition-drawer-out: the sheet leaves the page once its slide-out is over.
const CLOSE_MS = 200;

interface FamilySheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Narrow screens (≤ 1000px): a family's detail as a full-screen sheet sliding in from the
 * reading-start side, with "back to the list". Esc closes it; the caller moves the focus.
 */
export function FamilySheet({ isOpen, onClose, children }: FamilySheetProps) {
  const copy = useCopy(exerciseLibraryCopy);
  const { isMounted, isShown } = useDrawerTransition(isOpen, CLOSE_MS);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isMounted) return null;
  return createPortal(
    <div className={isShown ? 'family-sheet family-sheet-shown' : 'family-sheet'} role="dialog" aria-modal="true" inert={!isOpen}>
      <button className="family-sheet-back" type="button" onClick={onClose}>
        {copy.backToList}
      </button>
      {children}
    </div>,
    document.body,
  );
}
