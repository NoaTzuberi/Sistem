import type { KeyboardEvent } from 'react';
import { directionOf, useLanguage } from '@sistem/shared';

/**
 * Arrow keys / Home / End inside a horizontal role="tablist": moves the focus to the next tab
 * in READING order (so the arrows follow the screen in right-to-left too) and clicks it when it
 * is a tab that selects on focus (`data-selects`). Other tabs wait for Enter / Space.
 */
export function useTabListKeys() {
  const isRtl = directionOf(useLanguage()) === 'rtl';

  return function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    const current = tabs.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else if (event.key === 'ArrowRight') next = current + (isRtl ? -1 : 1);
    else if (event.key === 'ArrowLeft') next = current + (isRtl ? 1 : -1);
    else return;

    event.preventDefault();
    const tab = tabs[Math.max(0, Math.min(tabs.length - 1, next))];
    tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (tab.dataset.selects !== undefined) tab.click();
  };
}
