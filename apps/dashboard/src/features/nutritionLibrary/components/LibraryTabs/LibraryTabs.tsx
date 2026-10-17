import type { KeyboardEvent } from 'react';
import { useCopy } from '@sistem/shared';
import { LIBRARY_TABS, libraryTabId } from '../../data/libraryTabs';
import type { LibraryTab } from '../../data/libraryTabs';
import { nutritionLibraryCopy } from '../../copy';
import './LibraryTabs.css';

interface LibraryTabsProps {
  value: LibraryTab;
  /** Shown next to a tab's name; a tab without a number shows none. */
  counts: Partial<Record<LibraryTab, number>>;
  onChange: (tab: LibraryTab) => void;
  /** The id of the panel the tabs control. */
  panelId: string;
}

/** The library's sections as an iOS segmented control: a white thumb that slides (transform only). Arrows move between tabs. */
export function LibraryTabs({ value, counts, onChange, panelId }: LibraryTabsProps) {
  const copy = useCopy(nutritionLibraryCopy);
  const index = LIBRARY_TABS.indexOf(value);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const isRtl = document.documentElement.dir === 'rtl';
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = isRtl ? 'ArrowRight' : 'ArrowLeft';
    let next: number | null = null;
    if (event.key === forward) next = (index + 1) % LIBRARY_TABS.length;
    else if (event.key === backward) next = (index - 1 + LIBRARY_TABS.length) % LIBRARY_TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = LIBRARY_TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(LIBRARY_TABS[next]);
    document.getElementById(libraryTabId(LIBRARY_TABS[next]))?.focus();
  }

  return (
    <div className={`library-tabs library-tabs-at-${index}`} role="tablist" aria-label={copy.tabsLabel} onKeyDown={handleKeyDown}>
      <span className="library-tabs-thumb" aria-hidden="true" />
      {LIBRARY_TABS.map((tab) => (
        <button
          key={tab}
          id={libraryTabId(tab)}
          className="library-tabs-tab"
          type="button"
          role="tab"
          aria-selected={tab === value}
          aria-controls={panelId}
          tabIndex={tab === value ? 0 : -1}
          onClick={() => onChange(tab)}
        >
          {copy.tabs[tab]}
          {counts[tab] !== undefined && <span className="library-tabs-count">{counts[tab]}</span>}
        </button>
      ))}
    </div>
  );
}
