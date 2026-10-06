export interface AlumnoFormState {
  nombreCompleto: string;
  email: string;
  plantelId: number | null;
  password: string;
}

export interface QuizAlumno {
  id: string;
  titulo: string;
  grupoCode: string;
  grupoNombre: string;
  preguntas: number;
  segundosPorPregunta: number;
  abre: number;
  cierra: number;
}

export interface QuizAlumnoBackend {
  id?: string | number;
  titulo?: string;
  nombre?: string;
  grupoCode?: string;
  grupoId?: string | number;
  grupoNombre?: string;
  claveGrupo?: string;
  grupo?: string;
  preguntas?: number;
  totalPreguntas?: number;
  segundosPorPregunta?: number;
  duracionSegundos?: number;
  abre?: string | number;
  cierra?: string | number;
  inicio?: string | number;
  fin?: string | number;
  fechaInicio?: string | number;
  fechaFinalizacion?: string | number;
}

export interface GrupoAlumno {
  id: string;
  code: string;
  materia: string;
  grupo: string;
  docente: string;
  activos: number;
  proximos: number;
  pasados: number;
}

export interface GrupoAlumnoBackend {
  id?: string | number;
  code?: string;
  claveGrupo?: string;
  materia?: string;
  materiaNombre?: string;
  grupo?: string;
  grado?: string;
  nombre?: string;
  docente?: string;
  docenteNombre?: string;
  activos?: number;
  proximos?: number;
  pasados?: number;
}

export interface MisQuizCardProps {
  id: string;
  titulo: string;
  grupoCode: string;
  grupoNombre: string;
  preguntas: number;
  segundosPorPregunta: number;
  abre: number;
  cierra: number;
  activo: boolean;
  ahora: number;
  onOpenGroup: (grupoCode: string) => void;
  onStartQuiz: (grupoCode: string, quizId: string) => void;
}

export interface MisGrupoCardProps {
  id: string;
  materia: string;
  grupo: string;
  docente: string;
  activos: number;
  proximos: number;
  pasados: number;
  onClick: (code: string) => void;
}