import { apiClient } from './ApiClient';

export interface CurriculumGenerationSource {
  documentoId: string;
  checksumSha256: string;
  nombre: string;
}

export interface CurriculumProcessedSource {
  documentoId: string;
  checksumSha256: string;
}

export interface CurriculumGenerationRequest {
  grupoId: string;
  materiaNombre: string;
  arbol: unknown;
  fuentes: CurriculumGenerationSource[];
  fuentesProcesadas: CurriculumProcessedSource[];
  modoFusion: 'conservadora';
}

export interface CurriculumTaskStatus {
  tareaId: string;
  tipo: string;
  estado: 'EN_COLA' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR';
  progreso: string | null;
  resultado: unknown | null;
  error: string | null;
}

export async function createCurriculumTask(
  grupoId: string,
  request: CurriculumGenerationRequest,
) {
  const response = await apiClient.post<{ tareaId: string }>(
    `/api/grupos/${encodeURIComponent(grupoId)}/curriculo/generar`,
    request,
  );
  return response.data.tareaId;
}

export async function getCurriculumTask(
  grupoId: string,
  tareaId: string,
) {
  const response = await apiClient.get<CurriculumTaskStatus>(
    `/api/grupos/${encodeURIComponent(grupoId)}/curriculo/tareas/${encodeURIComponent(tareaId)}`,
  );
  return response.data;
}

export async function cancelCurriculumTask(
  grupoId: string,
  tareaId: string,
) {
  await apiClient.delete(
    `/api/grupos/${encodeURIComponent(grupoId)}/curriculo/tareas/${encodeURIComponent(tareaId)}`,
  );
}
