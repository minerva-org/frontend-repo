import { apiClient } from './ApiClient';

export type PersonaRol = 'DEV' | 'ADMIN' | 'ALUMNO' | 'COORDINADOR' | 'DOCENTE' | 'DIRECTOR_PLANTEL';

export interface PersonaRecord {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: PersonaRol;
  activo: boolean;
  plantelId: number | null;
}

export interface CreatePersonaPayload {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: PersonaRol;
  activo?: boolean;
  plantelId: number;
  username?: string;
  password?: string;
}

export function buildPersonaUsername(email: string, plantelId: number | string): string {
  const base = (email.trim().split('@')[0] ?? 'usuario')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .trim();

  const safeBase = base || 'usuario';
  const suffix = String(plantelId).replace(/\D/g, '').slice(-4) || '1';

  return `${safeBase}_${suffix}`;
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

export async function fetchPersonas(params?: { rol?: PersonaRol }) {
  return apiClient.get<PersonaRecord[]>('/api/personas', { params });
}

export async function fetchPersonasByRol(rol: PersonaRol) {
  return fetchPersonas({ rol });
}
