import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import './StateMessage.css';

interface StateMessageProps {
  children: ReactNode;
  /** Set for a failed load: the message is announced and gets a retry button. */
  onRetry?: () => void;
}

/** The loading / empty / error line of a screen or a section. */
export function StateMessage({ children, onRetry }: StateMessageProps) {
  return (
    <div className="state-message" role={onRetry ? 'alert' : undefined}>
      <p className="state-message-text">{children}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
