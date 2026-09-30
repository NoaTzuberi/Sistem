import { apiClient } from '../api/apiClient';
import type { ProgressEntry, ProgressEntryInput } from '../../features/progress/types';

export async function createProgressEntry(input: ProgressEntryInput): Promise<ProgressEntry> {
  const { data } = await apiClient.post<{ entry: ProgressEntry }>('/progress', input);
  return data.entry;
}

export async function listProgressEntries(limit?: number): Promise<ProgressEntry[]> {
  const { data } = await apiClient.get<{ items: ProgressEntry[] }>('/progress', { params: { limit } });
  return data.items;
}
