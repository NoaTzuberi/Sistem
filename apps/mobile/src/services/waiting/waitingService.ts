import type { WaitingStatus } from '@sistem/types';
import { apiClient } from '../api/apiClient';

/** The waiting screen's poll: server time, the plan deadline and the app state. */
export async function getWaitingStatus(): Promise<WaitingStatus> {
  const { data } = await apiClient.get<WaitingStatus>('/onboarding/waiting');
  return data;
}
