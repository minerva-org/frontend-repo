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