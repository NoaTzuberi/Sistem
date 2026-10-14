import type { ReactNode } from 'react';
import { IconArrowRight } from '@tabler/icons-react';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import './AuthSubmitButton.css';

interface AuthSubmitButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/** The pink pill that submits the login / sign-up form; its arrow points along the reading direction. */
export function AuthSubmitButton({ loading = false, disabled = false, children }: AuthSubmitButtonProps) {
  return (
    <button type="submit" className="auth-submit" disabled={loading || disabled} aria-busy={loading}>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <span>{children}</span>
          <IconArrowRight className="flip-rtl" size={20} stroke={2.4} aria-hidden="true" />
        </>
      )}
    </button>
  );
}
