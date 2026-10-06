import { useLocation, useNavigate } from 'react-router-dom';

// React Router gives the first entry of a session the key 'default'.
const FIRST_ENTRY_KEY = 'default';

/** Back to the previous screen, or to `fallbackPath` when the screen was opened directly. */
export function useGoBack(fallbackPath: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key === FIRST_ENTRY_KEY) navigate(fallbackPath, { replace: true });
    else navigate(-1);
  };
}
