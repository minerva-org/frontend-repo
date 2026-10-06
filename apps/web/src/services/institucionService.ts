import { apiClient } from './ApiClient';

export interface InstitucionResumen {
  id: number;
  nombre: string;
  activo?: boolean;
}

export async function fetchInstituciones() {
  return apiClient.get<InstitucionResumen[]>('/api/instituciones');
}