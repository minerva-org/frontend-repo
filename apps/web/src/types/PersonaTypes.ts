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
  password: string;
}

export interface UpdatePersonaPayload {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: PersonaRol;
  activo?: boolean;
  plantelId?: number;
}