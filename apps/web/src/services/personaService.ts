import { apiClient } from './ApiClient';
import type { CreatePersonaPayload, PersonaRecord, PersonaRol, UpdatePersonaPayload } from '../types/PersonaTypes.ts';
import type { PaginaResponse } from '../types/PaginacionTypes.ts';
export type {PersonaRecord}


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

export async function fetchPersonasByPlantelAndRol(plantelId: number, rol: 'ALUMNO' | 'DOCENTE' | 'COORDINADOR') {
  return apiClient.get<PersonaRecord[]>('/api/personas', { params: { plantelId, rol } });
}

export async function fetchPersonasPaginadas( plantelId: number, roles: PersonaRol |PersonaRol[],  page: number, size: number, activo?: boolean,search?: string){
  const rolesArray = Array.isArray(roles) ? roles : [roles]; //Esto es pa cuando se envien docentes y coordinadores, como son roles distintos ps no se podria sin esto
  return apiClient.get<PaginaResponse<PersonaRecord>>('/api/personas/paginados',{
    params:{
      plantelId,
      roles: rolesArray,
      page,
      size,
      activo,
      search
    },
    paramsSerializer:{
      indexes: null,
    },
  },);
}

export async function fetchPersonaByEmail(
  email: string,
  plantelId?: number,
  rol: 'ALUMNO' | 'DOCENTE' | 'COORDINADOR' = 'ALUMNO',
) {
  const normalizedEmail = email.trim().toLowerCase();
  const response = plantelId != null
    ? await fetchPersonasByPlantelAndRol(plantelId, rol)
    : await fetchPersonas({ rol });

  return (response.data ?? []).find(
    (persona) => persona.email?.trim().toLowerCase() === normalizedEmail,
  ) ?? null;
}

export async function fetchPersonaActual() {
  return apiClient.get<PersonaRecord>('/api/personas/me');
}

export async function fetchPersonaById(personaId:string){
  return apiClient.get<PersonaRecord>(`/api/personas/${personaId}`)
}