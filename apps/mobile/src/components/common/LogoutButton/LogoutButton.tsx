import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { Button } from '../Button/Button';
import './LogoutButton.css';

// Log out lives on Profile (PRD §5.5) now that the Sidebar is gone.
export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <Button variant="secondary" className="logout-button" onClick={handleLogout}>
      Log Out
    </Button>
  );
}
