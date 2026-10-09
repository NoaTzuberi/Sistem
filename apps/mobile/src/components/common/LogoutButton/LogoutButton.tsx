import { useNavigate } from 'react-router-dom';
import { sharedCopy, useCopy } from '@sistem/shared';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { Button } from '../Button/Button';
import './LogoutButton.css';

// Log out lives on Profile (PRD §5.5) now that the Sidebar is gone.
export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const copy = useCopy(sharedCopy);

  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <Button variant="secondary" className="logout-button" onClick={handleLogout}>
      {copy.common.logout}
    </Button>
  );
}
