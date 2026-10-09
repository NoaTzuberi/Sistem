import type { Language } from '@sistem/types';

// Which language the UI is in (Phase 15). Hebrew is the default; the signed-in user's
// choice is stored on the server (AuthUser.language). Before login the device remembers
// the language last used here.

export const LANGUAGES: readonly Language[] = ['he', 'en'];
export const DEFAULT_LANGUAGE: Language = 'he';

export type TextDirection = 'rtl' | 'ltr';

export function directionOf(language: Language): TextDirection {
  return language === 'he' ? 'rtl' : 'ltr';
}

export function isLanguage(value: unknown): value is Language {
  return (LANGUAGES as readonly unknown[]).includes(value);
}

/** The Intl locale for a language: Israel for Hebrew, US English otherwise. */
export function intlLocale(language: Language): string {
  return language === 'he' ? 'he-IL' : 'en-US';
}

const DEVICE_LANGUAGE_KEY = 'sistem.language';

/** The language last used on this device; Hebrew when none (or storage is blocked). */
export function readDeviceLanguage(): Language {
  try {
    const stored = globalThis.localStorage?.getItem(DEVICE_LANGUAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function writeDeviceLanguage(language: Language): void {
  try {
    globalThis.localStorage?.setItem(DEVICE_LANGUAGE_KEY, language);
  } catch {
    // Private mode / blocked storage: the server copy still wins after login.
  }
}

// The API client sends this as Accept-Language, so server messages come back in the
// language on screen — kept outside React because the client is created once.
let activeLanguage: Language = readDeviceLanguage();

export function getActiveLanguage(): Language {
  return activeLanguage;
}

export function setActiveLanguage(language: Language): void {
  activeLanguage = language;
}
