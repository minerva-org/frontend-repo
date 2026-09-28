import { apiClient } from "./ApiClient";
import { isAxiosError } from "axios";
import type {UserRole} from '../types.ts'

export interface LoginResponse {
  token: string;
  role: UserRole;
}

interface LoginResponseBackend{
    token:string;
    role: string;
}

const Roles: Record<string,UserRole> ={
    ALUMNO: 'alumno',
    DOCENTE: 'docente',
    COORDINADOR: 'coordinador',
    DIRECTOR_GENERAL: 'directorGeneral',
    DIRECTOR_PLANTEL: 'directorPlantel',
    ADMIN: 'admin',
    DEV: 'dev',
};

export const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
  'alumno@chapala.edu.mx': { password: 'Alumno#2024x', role: 'alumno' },
  'docente@chapala.edu.mx': { password: 'Docente#2024x', role: 'docente' },
  'coordinador@chapala.edu.mx': { password: 'Coordinador#2024x', role: 'coordinador' },
  'directorgeneral@chapala.edu.mx': { password: 'DirGeneral#2024x', role: 'directorGeneral' },
  'directorplantel@chapala.edu.mx': {password:'DirPlantel#2024x', role:'directorPlantel'},
};

async function mockLogin(email: string, password: string): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const user = MOCK_USERS[email.toLowerCase()];
  if (!user || user.password !== password) {
    throw new Error('Verifique sus credenciales');
  }
  return { token: `mock-token-${user.role}`, role: user.role };
}

console.log('USE_MOCK:', import.meta.env.VITE_USE_MOCK_AUTH);
export async function login(email: string, password: string): Promise<LoginResponse> {
    if (USE_MOCK) return mockLogin(email, password);
    let data: LoginResponseBackend;

    try {
        // TODO: cuando backend renombre LoginRequest, cambiar username por email
        const response = await apiClient.post<LoginResponseBackend>('/auth/login', {
        username: email,
        password,
        });
        data = response.data;
    } catch (err) {
        if (isAxiosError(err) && [401, 403].includes(err.response?.status ?? 0)) {
        throw new Error('Verifique sus credenciales', { cause: err });
        }
        throw new Error('No se pudo conectar con el servidor. Intente más tarde.', { cause: err });
    }

    const role = Roles[data.role];
    if (!role) {
        throw new Error('Tu cuenta no tiene acceso a esta aplicación.');
    }

    return { token: data.token, role };
}
/*
export async function login(email: string, password: string): Promise<LoginResponse> {
    let data: LoginResponseBackend;

    

    try {
        // TODO: cuando backend renombre LoginRequest, cambiar username por email
        const response = await apiClient.post<LoginResponseBackend>('/auth/login', {
        username: email,
        password,
        });
        data = response.data;
    } catch (err) {
        if (isAxiosError(err) && [401, 403].includes(err.response?.status ?? 0)) {
        throw new Error('Verifique sus credenciales', { cause: err });
        }
        throw new Error('No se pudo conectar con el servidor. Intente más tarde.', { cause: err });
    }

    const role = Roles[data.role];
    if (!role) {
        throw new Error('Tu cuenta no tiene acceso a esta aplicación.');
    }

    return { token: data.token, role };
}
*/
