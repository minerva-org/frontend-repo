import { apiClient } from './ApiClient';
import type { GrupoBackend } from '../types/GrupoTypes';

export async function fetchMisGrupos() {
  return apiClient.get<GrupoBackend[]>('/api/grupos/mis-grupos');
}
