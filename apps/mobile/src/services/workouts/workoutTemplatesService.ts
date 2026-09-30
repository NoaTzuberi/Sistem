import { apiClient } from '../api/apiClient';
import type { WorkoutTemplate, WorkoutTemplateInput, WorkoutCategory } from '../../features/workouts/types';

export interface ListWorkoutTemplatesParams {
  category?: WorkoutCategory;
  mine?: boolean;
}

export async function listWorkoutTemplates(
  params: ListWorkoutTemplatesParams = {},
): Promise<WorkoutTemplate[]> {
  const { data } = await apiClient.get<{ items: WorkoutTemplate[] }>('/workout-templates', {
    params: { category: params.category, mine: params.mine ? 'true' : undefined },
  });
  return data.items;
}

export async function getWorkoutTemplateById(id: string): Promise<WorkoutTemplate> {
  const { data } = await apiClient.get<{ template: WorkoutTemplate }>(`/workout-templates/${id}`);
  return data.template;
}

export async function createWorkoutTemplate(input: WorkoutTemplateInput): Promise<WorkoutTemplate> {
  const { data } = await apiClient.post<{ template: WorkoutTemplate }>('/workout-templates', input);
  return data.template;
}

export async function updateWorkoutTemplate(
  id: string,
  input: WorkoutTemplateInput,
): Promise<WorkoutTemplate> {
  const { data } = await apiClient.patch<{ template: WorkoutTemplate }>(`/workout-templates/${id}`, input);
  return data.template;
}

export async function deleteWorkoutTemplate(id: string): Promise<void> {
  await apiClient.delete(`/workout-templates/${id}`);
}
