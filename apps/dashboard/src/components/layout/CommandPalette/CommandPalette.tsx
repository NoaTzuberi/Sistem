import { useEffect, useRef } from 'react';
import { useCopy } from '@sistem/shared';
import { appCopy } from '../../../copy';
import { useCommandPalette } from '../../../hooks/useCommandPalette';
import type { PaletteMode } from '../../../hooks/useCommandPalette';
import { Icon } from '../../common/Icon/Icon';
import './CommandPalette.css';

interface CommandPaletteProps {
  mode: PaletteMode;
  onClose: () => void;
  onModeChange: (mode: PaletteMode) => void;
}

const OPTION_ID_PREFIX = 'palette-option-';

/**
 * ⌘K: search trainees, screens and actions. Opens and closes at once — no animation, it is
 * used all day. The focus stays in the text field; the arrows move the highlighted row.
 */
export function CommandPalette({ mode, onClose, onModeChange }: CommandPaletteProps) {
  const copy = useCopy(appCopy);
  const { query, changeQuery, sections, results, selectedIndex, setSelectedIndex, handleKeyDown } = useCommandPalette({
    mode,
    onClose,
    onModeChange,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const placeholder = mode === 'newPlan' ? copy.palette.pickTrainee : copy.palette.placeholder;

  // Give the focus back to whatever opened the palette.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      // A result that moved the focus itself (the drawer) keeps it.
      if (opener?.isConnected && (document.activeElement === document.body || document.activeElement === null)) opener.focus();
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, results]);

  let rowIndex = -1;
  return (
    <div className="palette-scrim" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label={placeholder} onKeyDown={handleKeyDown}>
        <div className="palette-field">
          <Icon name="search" />
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results.length > 0 ? `${OPTION_ID_PREFIX}${selectedIndex}` : undefined}
            aria-label={placeholder}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
          />
          {/* A key name. i18n-ignore */}
          <kbd className="palette-key">Esc</kbd>
        </div>

        <div className="palette-list" id="palette-list" role="listbox" aria-label={placeholder} ref={listRef}>
          {sections.map((section) => (
            <div key={section.id} role="group" aria-label={section.title}>
              <p className="palette-section">{section.title}</p>
              {section.results.map((result) => {
                rowIndex += 1;
                const index = rowIndex;
                return (
                  <button
                    key={result.id}
                    id={`${OPTION_ID_PREFIX}${index}`}
                    className="palette-item"
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === selectedIndex}
                    onPointerMove={() => index !== selectedIndex && setSelectedIndex(index)}
                    onClick={result.run}
                  >
                    <span className="palette-item-label">{result.isUserText ? <bdi>{result.label}</bdi> : result.label}</span>
                    {result.hint && <span className="palette-item-hint">{result.hint}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {results.length === 0 && <p className="palette-empty">{copy.palette.empty}</p>}
        </div>
      </div>
    </div>
  );
}
