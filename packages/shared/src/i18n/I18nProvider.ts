import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '@sistem/types';
import { formatPlural, type CopyDefinition, type CopyShape, type CopyVars, type Plural } from './copy';
import { directionOf, readDeviceLanguage, setActiveLanguage, writeDeviceLanguage, type TextDirection } from './language';

interface I18nContextValue {
  language: Language;
  direction: TextDirection;
  /** Switches at once, no reload; the caller saves it on the server for a signed-in user. */
  setLanguage: (language: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** One per app, above the router. Keeps <html lang dir> in step with the language. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readDeviceLanguage);

  const setLanguage = useCallback((next: Language) => {
    setActiveLanguage(next);
    writeDeviceLanguage(next);
    setLanguageState(next);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = directionOf(language);
  }, [language]);

  const value = useMemo(() => ({ language, direction: directionOf(language), setLanguage }), [language, setLanguage]);
  return createElement(I18nContext.Provider, { value }, children);
}

function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>.');
  return context;
}

export function useI18n() {
  const { language, direction, setLanguage } = useI18nContext();
  const pluralize = useCallback(
    (entry: Plural, count: number, vars?: CopyVars) => formatPlural(language, entry, count, vars),
    [language],
  );
  return { language, direction, setLanguage, plural: pluralize };
}

export function useLanguage(): Language {
  return useI18nContext().language;
}

/** A feature's texts in the language on screen. */
export function useCopy<T>(copy: CopyDefinition<T>): CopyShape<T> {
  return copy[useI18nContext().language];
}

/**
 * The signed-in user's saved language wins over the device's (Phase 15): when the auth user
 * loads or changes, the UI follows it.
 */
export function useUserLanguage(userLanguage: Language | undefined): void {
  const { language, setLanguage } = useI18nContext();
  useEffect(() => {
    if (userLanguage && userLanguage !== language) setLanguage(userLanguage);
    // Only a change of the saved language should switch the UI, not a local switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLanguage]);
}
