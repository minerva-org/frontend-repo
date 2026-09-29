export type UserRole =
  | 'alumno'
  | 'docente'
  | 'coordinador'
  | 'directorGeneral'
  | 'directorPlantel'
  | 'admin'
  | 'dev';

export interface Concepto {
  id: string;
  nombre: string;
}
 
export interface Tema {
  id: string;
  nombre: string;
  conceptos: Concepto[];
}
 
export interface Unidad {
  id: string;
  nombre: string;
  temas: Tema[];
}
 
export type StatusMateria = 'Activa' | 'Inactiva';
 
export interface Materia {
  id: string;
  nombre: string;
  planEstudioNombre: string | null;
  unidades: Unidad[];
  status: StatusMateria;
}

export interface Group {
  routeCode: string;
  grupo: string;
  docente: string | null;
  docenteEmail: string | null;
  coordinadoresEmail: string[];
  numeroEstudiantes: number;
  status: 'activo' | 'sin_docente' | 'archivado';
  atRisk: number;
  nextQuiz?: string;
}

export interface Plantel {
  id: number;
  nombre: string;
  direccion: string;
  institucionId: number;
  activo: boolean;
}