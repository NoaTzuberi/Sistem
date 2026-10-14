import { useEffect } from 'react';

interface AutosaveOptions {
  /** The draft differs from what the server holds. */
  isDirty: boolean;
  isSaving: boolean;
  /** The draft as it would be sent, and the last one the server refused (not retried until it changes). */
  payloadJson: string;
  failedJson: string | null;
  save: () => Promise<boolean>;
  delayMs: number;
}

/**
 * Saves shortly after the last change, sends the last changes when the builder is left inside the
 * dashboard, and asks before the tab is closed with changes still unsaved.
 */
export function useAutosave({ isDirty, isSaving, payloadJson, failedJson, save, delayMs }: AutosaveOptions): void {
  useEffect(() => {
    if (!isDirty || isSaving || payloadJson === failedJson) return;
    const timer = window.setTimeout(() => void save(), delayMs);
    return () => window.clearTimeout(timer);
  }, [isDirty, isSaving, payloadJson, failedJson, save, delayMs]);

  useEffect(() => () => void save(), [save]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);
}
