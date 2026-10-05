import type { AppNotification } from '@sistem/types';

export interface CoachNotificationView {
  text: string;
  /** The trainee the notification opens; each app builds its own path to her. */
  traineeId: string;
  /** The trainee section to open; null = her default section. Both apps call it 'logs'. */
  section: 'logs' | null;
}

/**
 * Notifications store no wording (type + data only): the coach's text and tap target
 * are built here, for the dashboard bell and the mobile Inbox alike. Types the coach
 * never receives (or does not know yet) return null and are not shown.
 */
export function describeCoachNotification(notification: AppNotification): CoachNotificationView | null {
  if (notification.type === 'trainee_onboarded') {
    return {
      text: `New trainee: ${notification.data.traineeName}`,
      traineeId: notification.data.traineeId,
      section: null,
    };
  }
  if (notification.type === 'workout_completed') {
    // Placeholder wording — the owner decides the final text.
    return {
      text: `${notification.data.traineeName} finished ${notification.data.workoutTitle}`,
      traineeId: notification.data.traineeId,
      section: 'logs',
    };
  }
  return null;
}
