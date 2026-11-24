import { apiClient } from './ApiClient';
import type {
  QuizGenerationTaskStatus,
} from '../types/QuizTypes';

export interface QuizGenerationRequest {
  prompt: string;
  arbol: unknown;
}

export async function createQuizGenerationTask(
  grupoId: string,
  request: QuizGenerationRequest,
) {
  const response = await apiClient.post<{ tareaId: string }>(
    `/api/quizzes/generar?grupoId=${encodeURIComponent(grupoId)}`,
    request,
  );
  return response.data.tareaId;
}

export async function getQuizGenerationTask(
  grupoId: string,
  tareaId: string,
) {
  const response =
    await apiClient.get<QuizGenerationTaskStatus>(
      `/api/quizzes/tareas/${encodeURIComponent(tareaId)}`
      + `?grupoId=${encodeURIComponent(grupoId)}`,
    );
  return response.data;
}

export async function cancelQuizGenerationTask(
  grupoId: string,
  tareaId: string,
) {
  await apiClient.delete(
    `/api/quizzes/tareas/${encodeURIComponent(tareaId)}`
    + `?grupoId=${encodeURIComponent(grupoId)}`,
  );
}
