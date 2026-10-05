import { useCallback, useSyncExternalStore } from 'react';
import { isSoundMuted, setSoundMuted, subscribeSoundMuted } from '../data/intervalSounds';

/** The one mute setting for all workout timers, kept in sync across every toggle on screen. */
export function useSoundMuted(): [muted: boolean, toggle: () => void] {
  const muted = useSyncExternalStore(subscribeSoundMuted, isSoundMuted, () => false);
  const toggle = useCallback(() => setSoundMuted(!isSoundMuted()), []);
  return [muted, toggle];
}
