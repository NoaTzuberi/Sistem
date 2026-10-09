import { useCopy } from '@sistem/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { nutritionCopy } from '../../copy';
import './CoachIntro.css';

interface CoachIntroProps {
  text: string;
  /** Open while she hasn't read this version's note yet; collapsed after. */
  initiallyOpen: boolean;
  /** Called once when the note was shown open (the server then remembers it as read). */
  onRead?: () => void;
}

/** The coach's note at the top of the Nutrition tab (13a+) — plain text, line breaks kept. */
export function CoachIntro({ text, initiallyOpen, onRead }: CoachIntroProps) {
  const copy = useCopy(nutritionCopy);
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const bodyId = useId();
  const reported = useRef(false);

  useEffect(() => {
    if (isOpen && !reported.current) {
      reported.current = true;
      onRead?.();
    }
  }, [isOpen, onRead]);

  return (
    <section className={'coach-intro' + (isOpen ? ' coach-intro-open' : '')}>
      <button
        type="button"
        className="coach-intro-header"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        aria-label={isOpen ? copy.introHide : copy.introShow}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="coach-intro-title">{copy.introTitle}</span>
        <IconChevronDown className="coach-intro-chevron" size={20} aria-hidden="true" />
      </button>
      {isOpen && (
        <p id={bodyId} className="coach-intro-text" dir="auto">
          {text}
        </p>
      )}
    </section>
  );
}
