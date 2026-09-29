import { apiClient } from './ApiClient';

export type PersonaRol = 'DEV' | 'ADMIN' | 'ALUMNO' | 'COORDINADOR' | 'DOCENTE' | 'DIRECTOR_PLANTEL';

export interface CreatePersonaPayload {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: PersonaRol;
  activo?: boolean;
  plantelId: number;
  username?: string;
}

export interface UpdatePersonaPayload {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: PersonaRol;
  activo?: boolean;
  plantelId?: number;
}

export async function createPersona(payload: CreatePersonaPayload) {
  return apiClient.post('/api/personas', payload);
}

export async function updatePersona(personaId: string, payload: UpdatePersonaPayload) {
  return apiClient.patch(`/api/personas/${personaId}`, payload);
}
