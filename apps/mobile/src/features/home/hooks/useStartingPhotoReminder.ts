import { useEffect, useState } from 'react';
import { useAuth } from '../../../services/auth/AuthContext';
import { useMyBodyMetrics } from '../../profile/hooks/useMyBody';

function reminderKey(userId: string): string {
  return `sistem.startingPhotoReminderDismissed.${userId}`;
}

function readDismissed(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(reminderKey(userId)) === 'true';
  } catch {
    return false;
  }
}

export function useStartingPhotoReminder() {
  const { user } = useAuth();
  const { list } = useMyBodyMetrics();
  const [dismissedUserId, setDismissedUserId] = useState<string>();

  useEffect(() => {
    if (user?.id && readDismissed(user.id)) setDismissedUserId(user.id);
    else setDismissedUserId(undefined);
  }, [user?.id]);

  function dismiss() {
    if (!user?.id) return;
    try {
      localStorage.setItem(reminderKey(user.id), 'true');
    } catch {
      // The card still dismisses for this mount if storage is unavailable.
    }
    setDismissedUserId(user.id);
  }

  const hasStartingPhoto = list?.items.some((metric) => Boolean(metric.startingPhoto)) ?? false;
  return { isVisible: Boolean(list && !hasStartingPhoto && dismissedUserId !== user?.id), dismiss };
}
