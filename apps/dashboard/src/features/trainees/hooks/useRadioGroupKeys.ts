import type { KeyboardEvent } from 'react';
import { directionOf, useLanguage } from '@sistem/shared';

/**
 * Arrow keys inside a role="radiogroup" of buttons: the next / previous ENABLED radio takes the
 * focus and is chosen (a click), wrapping around. ← → follow the screen in right-to-left too.
 */
export function useRadioGroupKeys() {
  const isRtl = directionOf(useLanguage()) === 'rtl';

  return function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const step = event.key === 'ArrowDown' || event.key === forwardKey ? 1 : event.key === 'ArrowUp' || event.key === backKey ? -1 : 0;
    if (step === 0) return;
    const radios = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'));
    const current = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1 || radios.length === 0) return;
    event.preventDefault();
    const next = radios[(current + step + radios.length) % radios.length];
    next.focus();
    next.click();
  };
}
