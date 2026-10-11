import { useNavigate } from 'react-router-dom';
import { sharedCopy, useCopy } from '@sistem/shared';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { Button } from '../Button/Button';
import type { ButtonVariant } from '../Button/Button';
import './LogoutButton.css';

interface LogoutButtonProps {
  /** `ghost` = the quiet text button (waiting screen). */
  variant?: ButtonVariant;
  className?: string;
}

// Log out lives on Profile (PRD §5.5) now that the Sidebar is gone.
export function LogoutButton({ variant = 'secondary', className }: LogoutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const copy = useCopy(sharedCopy);

  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <Button
      variant={variant}
      className={['logout-button', className].filter(Boolean).join(' ')}
      onClick={handleLogout}
    >
      {copy.common.logout}
    </Button>
  );
}
