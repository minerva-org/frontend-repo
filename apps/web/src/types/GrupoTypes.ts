export interface GrupoDetalleBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  docenteId: string;
  plantelId: number | null;
  alumnosIds?: string[];
}

export interface GrupoBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  activo?: boolean;
  docenteId: string | null;
  plantelId: number | null;
  alumnosIds?: string[];
}

export interface GrupoListado extends GrupoBackend {
  docenteNombre: string;
  docenteEmail: string;
  alumnosCount: number;
}

export interface GrupoSelectablePersona {
  id: string;
  label: string;
}

export interface NewGroupData {
  grupo: string;
  claveGrupo: string;
  grado: string;
  docente: string | null;
  docenteId: string | null;
  materia: string;
  alumnosIds: string[];
  numeroEstudiantes: string[];
  plantelId: number | null;
}

export interface AlumnoEntry {
  id: string;
  nombre: string;
  estado: 'pendiente' | 'normal';
  calificacion?: number;
}

export interface QuizCatalogBackend {
  id: string;
  nombre: string;
  fechaCreacion?: string | null;
  fechaInicio?: string | null;
  fechaFinalizacion?: string | null;
  grupoId?: string | null;
}