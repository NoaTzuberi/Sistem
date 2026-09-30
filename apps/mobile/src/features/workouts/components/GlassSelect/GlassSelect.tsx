import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '../icons';
import './GlassSelect.css';

interface GlassSelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

/** A custom-animated dropdown matching the glass input language — native
 * <select> popups can't be styled or given an open/close transition, so this
 * is a real listbox (button trigger + portal-rendered option panel).
 *
 * The panel renders through a portal into document.body rather than as a
 * normal absolutely-positioned child: the glass panels it lives inside use
 * backdrop-filter, which (like transform/filter/opacity<1) creates a new
 * stacking context — z-index alone can't lift the menu above a *sibling*
 * panel from inside one, so it has to escape the DOM tree entirely. */
export function GlassSelect({ label, value, onChange, options, placeholder }: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerId = useId();

  const selected = options.find((option) => option.value === value);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('.glass-select-menu')) return;
      setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    // Closing on scroll avoids having to keep the portal's position in sync
    // with the trigger while the page moves underneath it.
    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  function selectOption(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div className="glass-select" ref={rootRef}>
      {label && (
        <span className="glass-select-label" id={triggerId}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        className={'glass-select-trigger' + (isOpen ? ' glass-select-trigger-open' : '')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? triggerId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
      >
        <span className={selected ? '' : 'glass-select-placeholder'}>{selected ? selected.label : placeholder}</span>
        <span className="glass-select-chevron" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {menuPosition &&
        createPortal(
          <ul
            className={'glass-select-menu' + (isOpen ? ' glass-select-menu-open' : '')}
            role="listbox"
            style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }}
          >
            {placeholder && (
              <li
                role="option"
                aria-selected={value === ''}
                className={'glass-select-option' + (value === '' ? ' glass-select-option-selected' : '')}
                onClick={() => selectOption('')}
              >
                {placeholder}
              </li>
            )}
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={'glass-select-option' + (option.value === value ? ' glass-select-option-selected' : '')}
                onClick={() => selectOption(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
