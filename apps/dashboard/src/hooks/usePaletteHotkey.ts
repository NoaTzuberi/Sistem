import { useEffect } from 'react';

/** ⌘K on a Mac, Ctrl+K elsewhere — from anywhere in the dashboard, also while typing. */
export function usePaletteHotkey(onToggle: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onToggle();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);
}

/** How the shortcut is written on this computer. */
export function paletteShortcutLabel(): string {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  // Key names, not words. i18n-ignore
  return isMac ? '⌘K' : 'Ctrl K';
}
