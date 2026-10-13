import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from '../Icon/Icon';
import './ActionMenu.css';

export interface ActionMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  /** A destructive action: Cherry Rose text. */
  danger?: boolean;
  onSelect: () => void;
}

interface ActionMenuProps {
  /** The accessible name of the round "⋯" button. */
  label: string;
  items: ActionMenuItem[];
  /** floating = white on the canvas · ghost = small and transparent, on a workout's hero band. */
  variant?: 'floating' | 'ghost';
}

/**
 * The round "⋯" button and its menu of secondary actions. The menu grows from the button;
 * a press outside or Esc closes it (Esc gives the focus back to the button); ↑ ↓ Home End move
 * between the items. While closed the menu is not in the page.
 */
export function ActionMenu({ label, items, variant = 'floating' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    // Keyboard users land on the first action they can take.
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  function close(returnFocus: boolean) {
    setIsOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // The menu's Esc must not also close a sheet or drawer under it.
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      setIsOpen(false);
      return;
    }
    const enabled = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const current = enabled.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (current + 1) % enabled.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else return;
    event.preventDefault();
    enabled[next]?.focus();
  }

  function select(item: ActionMenuItem) {
    close(true);
    item.onSelect();
  }

  return (
    <div className="action-menu" ref={containerRef} onKeyDown={isOpen ? handleKeyDown : undefined}>
      <button
        ref={buttonRef}
        className={`action-menu-button action-menu-button-${variant}`}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name="more" className="action-menu-dots" />
      </button>

      {isOpen && (
        <div className="action-menu-list" id={menuId} ref={menuRef} role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.id}
              className={item.danger ? 'action-menu-item action-menu-item-danger' : 'action-menu-item'}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => select(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
