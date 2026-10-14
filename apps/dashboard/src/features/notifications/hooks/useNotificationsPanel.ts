import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex="0"]';

/**
 * The bell's panel as a modal: open / close, Esc, the focus moving in on open and back to the
 * bell on close, and Tab staying inside while it is open.
 */
export function useNotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    if (!isOpen) return;
    const bell = bellRef.current;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    // The panel itself takes the focus: the title is read, and Tab goes to its first control.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Back to the bell (it stays in the top line, also after a notification took her elsewhere).
      if (bell?.isConnected) bell.focus();
    };
  }, [isOpen]);

  function keepFocusInside(event: ReactKeyboardEvent) {
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable.at(-1);
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return { isOpen, close, toggle, bellRef, panelRef, keepFocusInside };
}
