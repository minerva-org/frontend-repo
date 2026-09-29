import { isAxiosError } from 'axios';
import type { UserRole } from '../types.ts';
import { apiClient } from './ApiClient';

export interface LoginResponse {
  token: string;
  role: UserRole | null;
}

interface LoginResponseBackend {
  token: string;
  role?: string | null;
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
export const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
  'alumno@chapala.edu.mx': { password: 'Alumno#2024x', role: 'alumno' },
  'docente@chapala.edu.mx': { password: 'Docente#2024x', role: 'docente' },
  'coordinador@chapala.edu.mx': { password: 'Coordinador#2024x', role: 'coordinador' },
  'directorgeneral@chapala.edu.mx': { password: 'DirGen#2024x', role: 'directorGeneral' },
  'directorplantel@chapala.edu.mx': {password:'DirPlantel#2024x', role:'directorPlantel'},
};
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

export function inferRoleFromUsername(username: string): UserRole | null {
  const normalized = username.trim().toLowerCase().replace(/[-_\s]/g, '');

  if (normalized === 'bootstrap') return 'admin';
  if (normalized === 'directorgeneral') return 'directorGeneral';
  if (normalized === 'directorplantel') return 'directorPlantel';
  if (normalized === 'dev' || normalized === 'developer') return 'dev';

  return null;
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
    const role = normalizeRole(response.data.role) ?? decodeJwtRole(token) ?? inferRoleFromUsername(trimmedUsername);

    return { token, role };
  } catch (error) {
    if (isAxiosError(error) && [400, 401, 403].includes(error.response?.status ?? 0)) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    throw new Error('No se pudo conectar con el servidor. Intente más tarde.');
  }
}
