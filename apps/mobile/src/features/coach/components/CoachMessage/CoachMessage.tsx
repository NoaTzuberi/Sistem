import type { ReactNode } from 'react';
import { Button } from '../../../../components/common/Button/Button';
import './CoachMessage.css';

interface CoachMessageProps {
  children: ReactNode;
  /** Set for a failed load: the message is announced and gets a retry button. */
  onRetry?: () => void;
}

/** The loading / empty / error line of the coach screens. */
export function CoachMessage({ children, onRetry }: CoachMessageProps) {
  return (
    <div className="coach-message" role={onRetry ? 'alert' : undefined}>
      <p className="coach-message-text">{children}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
