import { useCallback, useState } from 'react';

/** `prompt` = she has not been asked yet, so a "turn on notifications" control makes sense. */
export type PushPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface PushPermission {
  status: PushPermissionStatus;
  /** Asks the device for permission and registers this device for push. */
  request: () => Promise<void>;
}

/**
 * The device's push permission and the way to ask for it.
 *
 * TODO(5b): a stub. Phase 5b (Capacitor + FCM) reads the real permission here, asks for it in
 * `request`, sends the device token to the server (User.pushTokens) and fails gracefully when
 * she says no (PRD §9). Until then it reports `prompt` and `request` does nothing — screens
 * keep their control hidden behind PUSH_ENABLED (data/pushConfig.ts).
 */
export function usePushPermission(): PushPermission {
  const [status] = useState<PushPermissionStatus>('prompt');

  const request = useCallback(async () => {
    // TODO(5b): PushNotifications.requestPermissions() → register() → save the token.
  }, []);

  return { status, request };
}
