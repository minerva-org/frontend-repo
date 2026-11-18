import { isAxiosError } from 'axios';
import type { UserRole } from '../types/types.ts';
import { apiClient } from './ApiClient';

export interface LoginResponse {
  token: string;
  role: UserRole | null;
  personaId: string;
}

interface LoginResponseBackend {
  token: string;
  role?: UserRole | null;
  personaId: string;
}

const ROLE_MAP: Record<string, UserRole> = {
  ADMIN: 'admin',
  ALUMNO: 'alumno',
  COORDINADOR: 'coordinador',
  DOCENTE: 'docente',
  DIRECTOR_GENERAL: 'directorGeneral',
  DIRECTOR_PLANTEL: 'directorPlantel',
  DEV: 'dev',
};

export function normalizeRole(rawRole?: string | null): UserRole | null {
  if (!rawRole) return null;
  const normalized = rawRole.toUpperCase().replace(/[-\s]/g, '_');
  return ROLE_MAP[normalized] ?? null;
}
export function decodeJwtRole(token?: string | null) {
  if (!token) return null;


  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;

    const normalizedPayload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(normalizedPayload);
    const parsed = JSON.parse(jsonPayload) as { role?: string; roles?: string | string[]; authorities?: string | string[] };

    const directRole = parsed.role ?? parsed.roles;
    if (typeof directRole === 'string') return normalizeRole(directRole);
    if (Array.isArray(directRole) && directRole.length > 0) return normalizeRole(directRole[0]);

    const authorities = parsed.authorities;
    if (typeof authorities === 'string') return normalizeRole(authorities);
    if (Array.isArray(authorities) && authorities.length > 0) return normalizeRole(authorities[0]);

    return null;
  } catch {
    return null;
  }
}


export async function login(username: string, password: string): Promise<LoginResponse> {
  const trimmedUsername = username.trim();

  if (!trimmedUsername || !password.trim()) {
    throw new Error('Debe ingresar usuario y contraseña.');
  }

  try {
    const response = await apiClient.post<LoginResponseBackend>('/auth/login', {
      username: trimmedUsername,
      password,
    });

    const token = response.data.token;
    const role = normalizeRole(response.data.role) ?? decodeJwtRole(token);

    return {
      token,
      role,
      personaId: response.data.personaId,
    };
    } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const codigo = error.response?.data?.codigo;

      if (codigo === 'CUENTA_DESHABILITADA') {
        throw new Error('Cuenta deshabilitada. Comunícate con tu coordinador o institución.', { cause: error });
      }

      if ([400, 401, 403, 409].includes(status ?? 0)) {
        throw new Error('Usuario o contraseña incorrectos.', {cause: error});
      }
    }

    throw new Error('No se pudo conectar con el servidor. Intente más tarde.', { cause: error });
  }
}