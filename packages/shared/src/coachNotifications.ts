import type { AppNotification } from '@sistem/types';

export interface CoachNotificationView {
  text: string;
  /** The trainee the notification opens; each app builds its own path to her. */
  traineeId: string;
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
    };
  }
  return null;
}
