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
  tipoQuiz: string;
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
  idConceptoOrigen?: string | null;
}

export interface ContenidoCurriculoCatalogo {
  id: string;
  descripcion: string;
}

export interface ConceptoGrupoCatalogo {
  id: string;
  nombre: string;
  idTemaGrupo: string;
  idConceptoOrigen?: string | null;
  activo?: boolean;
  contenidos: ContenidoCurriculoCatalogo[];
}

export interface TemaGrupoCatalogo {
  id: string;
  nombre: string;
  idUnidadGrupo: string;
  idTemaOrigen?: string | null;
  activo?: boolean;
  conceptos: ConceptoGrupoCatalogo[];
}

export interface UnidadGrupoCatalogo {
  id: string;
  nombre: string;
  idMateria?: string | null;
  idGrupo?: string | null;
  idUnidadOrigen?: string | null;
  activo?: boolean;
  temas: TemaGrupoCatalogo[];
}

export interface CurriculoGrupoCatalogo {
  idGrupo: string;
  unidades: UnidadGrupoCatalogo[];
  fuentes: unknown[];
}

export interface Opcion {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

export interface Pregunta {
  id: string;
  quizXPreguntaId?: string;
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

export interface QuizXPreguntaResponse {
  id: string;
  quizId: string;
  preguntaId: string;
}

export interface OpcionAlumno {
  id: string;
  descripcion: string;
}

export interface PreguntaAlumno {
  id: string;
  descripcion: string;
  numero: number;
  total: number;
  opciones: OpcionAlumno[];
}

export interface IntentoResponse {
  intentoId: string;
  quizId: string;
  fechaFinalizacion: string;
  finalizado: boolean;
  preguntaActual: PreguntaAlumno | null;
}

export interface ResultadoIntento {
  correctas: number;
  enBlanco: number;
  total: number;
}

export interface QuizGenerationOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizGenerationQuestion {
  conceptId: string;
  conceptName?: string;
  question: string;
  evidence: string;
  options: QuizGenerationOption[];
}

export interface QuizGenerationResult {
  questions: QuizGenerationQuestion[];
}

export interface QuizGenerationTaskStatus {
  tareaId: string;
  tipo: 'QUIZ_GENERATE';
  estado: 'EN_COLA' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR';
  progreso: string | null;
  resultado: QuizGenerationResult | null;
  error: string | null;
}

export interface RespuestaRequest {
  preguntaId: string;
  opcionId: string | null;
  cambiosPantalla: number;
}