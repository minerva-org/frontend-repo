export type PersonaRol = 'DEV' | 'ADMIN' | 'ALUMNO' | 'COORDINADOR' | 'DOCENTE' | 'DIRECTOR_PLANTEL';

export interface PersonaRecord {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  email: string;
  rol: PersonaRol;
  activo: boolean;
  plantelId: number;
  calle: string;
  colonia: string;
  codigoPostal: string;
  municipio: string;
  estado: string;
  numeroTelefono: string;
  carrera?: string;
  tituloEdu?: string;
  nombreTutor?: string | null;
  numeroTutor?: string | null;
  fechaIngreso?: string | null;
}

export interface CreatePersonaPayload {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  email: string;
  rol: PersonaRol;
  activo?: boolean;
  plantelId: number;
  username?: string;
  password: string;
  calle: string;
  colonia: string;
  codigoPostal: string;
  municipio: string;
  estado: string;
  numeroTelefono: string;
  carrera?: string;
  tituloEdu?: string;
  nombreTutor?: string;
  numeroTutor?: string;
  fechaIngreso?: string | null;

}

export interface UpdatePersonaPayload {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string | null;
  email?: string;
  rol?: PersonaRol;
  activo?: boolean;
  plantelId?: number;
  calle?: string;
  colonia?: string;
  codigoPostal?: string;
  municipio?: string;
  estado?: string;
  numeroTelefono?: string;
  password?: string;
  carrera?: string;
  tituloEdu?: string;
  nombreTutor?:string;
  numeroTutor?: string;
  fechaIngreso?: string | null;
}
