import { useState } from 'react';
import { Button } from '../../../../components/common/Button/Button';
import { FOCUS_TIP_COPY } from '../../data/workoutCopy';
import './FocusTip.css';

// "Don't show again" is remembered on this phone only (a per-device convenience).
const HIDE_KEY = 'sistem.focusTip.hidden';

function isHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * A gentle tip at the start of a fresh workout: turn on Focus / Do Not Disturb (PRD §14,
 * web version; the native DND / Focus parts come with Capacitor in Phase 5b).
 */
export function FocusTip() {
  const [isOpen, setIsOpen] = useState(() => !isHidden());
  if (!isOpen) return null;

  function hideForGood() {
    try {
      localStorage.setItem(HIDE_KEY, '1');
    } catch {
      // Storage blocked: it just shows again next time.
    }
    setIsOpen(false);
  }

  return (
    <aside className="focus-tip" role="note">
      <p className="focus-tip-text">{FOCUS_TIP_COPY.text}</p>
      <div className="focus-tip-actions">
        <Button variant="secondary" onClick={() => setIsOpen(false)}>
          {FOCUS_TIP_COPY.gotIt}
        </Button>
        <Button variant="ghost" onClick={hideForGood}>
          {FOCUS_TIP_COPY.dontShowAgain}
        </Button>
      </div>
    </aside>
  );
}
