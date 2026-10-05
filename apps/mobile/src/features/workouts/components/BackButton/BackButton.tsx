import { useLocation, useNavigate } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';
import { ROUTES } from '../../../../app/config/routes';
import { WORKOUTS_COPY } from '../../data/workoutCopy';
import './BackButton.css';

// React Router gives the first entry of a session the key 'default'.
const FIRST_ENTRY_KEY = 'default';

/** Back to where the trainee came from (Home or Workouts); Workouts when opened directly. */
export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (location.key === FIRST_ENTRY_KEY) navigate(ROUTES.WORKOUTS, { replace: true });
    else navigate(-1);
  }

  return (
    <button className="back-button" type="button" onClick={goBack} aria-label={WORKOUTS_COPY.back}>
      <IconChevronLeft size={24} aria-hidden="true" />
    </button>
  );
}
