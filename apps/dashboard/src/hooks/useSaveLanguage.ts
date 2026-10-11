import { useCallback, useState } from 'react';
import type { Language } from '@sistem/types';
import { useI18n } from '@sistem/shared';
import { updatePreferences } from '../services/auth/authService';
import { useAuth } from '../services/auth/AuthContext';

/**
 * For a language toggle on a signed-in screen: the UI has already switched; saving makes it her
 * language on every device (and for server texts). A failed save switches back.
 */
export function useSaveLanguage(): { saveLanguage: (next: Language) => void; hasError: boolean } {
  const { updateUser } = useAuth();
  const { setLanguage } = useI18n();
  const [hasError, setHasError] = useState(false);

  const saveLanguage = useCallback(
    (next: Language) => {
      const previous: Language = next === 'he' ? 'en' : 'he';
      setHasError(false);
      updatePreferences({ language: next })
        .then((updated) => updateUser({ language: updated.language }))
        .catch(() => {
          setLanguage(previous);
          setHasError(true);
        });
    },
    [updateUser, setLanguage],
  );

  return { saveLanguage, hasError };
}
