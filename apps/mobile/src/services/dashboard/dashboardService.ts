import { apiClient } from '../api/apiClient';
import type { DashboardSummary } from '../../features/dashboard/types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return data;
}
