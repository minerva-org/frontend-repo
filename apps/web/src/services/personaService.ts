import { apiClient } from './ApiClient';
import type { CreatePersonaPayload, PersonaRecord, PersonaRol, UpdatePersonaPayload } from '../types/PersonaTypes.ts';

export type { PersonaRecord, PersonaRol, CreatePersonaPayload, UpdatePersonaPayload } from '../types/PersonaTypes.ts';

export function buildPersonaUsername(email: string, plantelId: number | string): string {
  const base = (email.trim().split('@')[0] ?? 'usuario')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .trim();

  const safeBase = base || 'usuario';
  const suffix = String(plantelId).replace(/\D/g, '').slice(-4) || '1';

  return `${safeBase}_${suffix}`;
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

export async function fetchPersonasByPlantelAndRol(plantelId: number, rol: 'ALUMNO' | 'DOCENTE') {
  return apiClient.get<PersonaRecord[]>('/api/personas', { params: { plantelId, rol } });
}

export async function fetchPersonaByEmail(email: string) {
  const response = await fetchPersonas();
  const normalizedEmail = email.trim().toLowerCase();
  return (response.data ?? []).find((persona) => persona.email.toLowerCase() === normalizedEmail) ?? null;
}
