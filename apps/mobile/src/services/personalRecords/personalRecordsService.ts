import { apiClient } from '../api/apiClient';

interface PersonalRecordSummary {
  id: string;
}

export async function listPersonalRecords(limit = 50): Promise<PersonalRecordSummary[]> {
  const { data } = await apiClient.get<{ items: PersonalRecordSummary[] }>('/personal-records', {
    params: { limit },
  });
  return data.items;
}
