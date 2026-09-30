import { apiClient } from '../api/apiClient';
import type {
  PublicExercise,
  PaginatedExercises,
  Difficulty,
  MovementType,
} from '../../features/exercises/types';

export interface ListExercisesParams {
  page?: number;
  limit?: number;
  category?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: Difficulty;
  movementType?: MovementType;
  search?: string;
}

export async function listExercises(params: ListExercisesParams = {}): Promise<PaginatedExercises> {
  const { data } = await apiClient.get<PaginatedExercises>('/exercises', { params });
  return data;
}

export async function getExerciseBySlug(slug: string): Promise<PublicExercise> {
  const { data } = await apiClient.get<{ exercise: PublicExercise }>(`/exercises/${slug}`);
  return data.exercise;
}
