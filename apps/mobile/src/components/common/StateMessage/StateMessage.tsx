import type { ReactNode } from 'react';
import { sharedCopy, useCopy } from '@sistem/shared';
import { Button } from '../Button/Button';
import './StateMessage.css';

interface StateMessageProps {
  children: ReactNode;
  /** Set for a failed load: the message is announced and gets a retry button. */
  onRetry?: () => void;
}

/** The loading / empty / error line of a screen or a section. */
export function StateMessage({ children, onRetry }: StateMessageProps) {
  const copy = useCopy(sharedCopy);
  return (
    <div className="state-message" role={onRetry ? 'alert' : undefined}>
      <p className="state-message-text">{children}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {copy.common.retry}
        </Button>
      )}
    </div>
  );
}
