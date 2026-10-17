import { useCallback, useRef, useState } from 'react';

export type PublishStep = 'closed' | 'confirm' | 'publishing' | 'failed' | 'done';

/**
 * The publish modal's steps: open → confirm → the existing publish call → done (or failed, to
 * try again). `publish` resolves to false when the server refused it. A second confirm while
 * one is running does nothing; closing waits until it is over. The focus goes back to whatever
 * opened it.
 */
export function usePublishFlow(publish: () => Promise<boolean>) {
  const [step, setStep] = useState<PublishStep>('closed');
  const running = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStep('confirm');
  }, []);

  const confirm = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setStep('publishing');
    try {
      setStep((await publish()) ? 'done' : 'failed');
    } catch {
      setStep('failed');
    } finally {
      running.current = false;
    }
  }, [publish]);

  const close = useCallback(() => {
    if (running.current) return;
    setStep('closed');
    const trigger = opener.current;
    opener.current = null;
    if (trigger?.isConnected) trigger.focus();
  }, []);

  return { step, isOpen: step !== 'closed', open, confirm, close };
}

export type PublishFlow = ReturnType<typeof usePublishFlow>;
