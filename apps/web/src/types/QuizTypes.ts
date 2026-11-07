export interface QuestionOptions {
  id: string;
  texto: string;
}

export interface QuestionQuiz {
  id: string;
  texto: string;
  opciones: QuestionOptions[];
}

export interface QuizData {
  titulo: string;
  inicio: string;
  fin: string;
  preguntas: QuestionQuiz[];
}

export interface QuizCatalogCardData {
  id: string;
  nombre: string;
  fechaCreacion?: string | null;
  fechaInicio?: string | null;
  fechaFinalizacion?: string | null;
  grupoId?: string | null;
}

export type QuizCatalogState = 'proximo' | 'activo' | 'pasado';

export interface QuizPreguntaPreview {
  id: string;
  descripcion?: string;
  enunciado?: string;
}

export interface QuizBackend {
  id: string;
  nombre: string;
  fechaCreacion?: string | null;
  fechaInicio?: string | null;
  fechaFinalizacion?: string | null;
  grupoId?: string | null;
}

export interface UnidadCatalogo {
  id: string;
  nombre: string;
  idMateria: string;
}

export interface TemaCatalogo {
  id: string;
  nombre: string;
  unidadId: string;
}

export interface ConceptoCatalogo {
  id: string;
  nombre: string;
  temaId: string;
}

export interface Opcion {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

export interface Pregunta {
  id: string;
  unidadId: string;
  temaId: string;
  conceptoId: string;
  enunciado: string;
  opciones: Opcion[];
}

export interface PreguntaQuizResponse {
  id: string;
  descripcion: string;
  conceptoId: string;
}

export interface OpcionQuizResponse {
  id: string;
  descripcion: string;
  esCorrecta: boolean;
}