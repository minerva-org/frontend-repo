export interface EstadisticasGenerales {
  promedioGeneral: number;
  porcentajeAprobacion: number;
  porcentajeReprobacion: number;
  indiceFocoLimpio: number;
  alumnosEvaluados: number;
  intentosFinalizados: number;
  incidenciasFoco: number;
  intentosAprobados: number;
  intentosReprobados: number;
}

export interface EstadisticasMateria {
  materiaId: string;
  nombreMateria: string;
  porcentajeAprobacion: number;
  intentosFinalizados: number;
  intentosAprobados: number;
  incidenciasFoco: number;
}

export interface EstadisticasDocente {
  docenteId: string;
  nombreDocente: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  quizzesAplicados: number;
  intentosFinalizados: number;
}

export interface EstadisticasGrupo extends EstadisticasGenerales {
  grupoId: string;
  nombreGrupo: string;
  claveGrupo: string;
  semestre: string;
  quizzesAplicados: number;
}

export interface EstadisticasGrupoResumen {
  grupoId: string;
  nombreGrupo: string;
  claveGrupo: string;
  semestre: string;
  docenteId: string | null;
  nombreDocente: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  materiaId: string | null;
  nombreMateria: string | null;
  porcentajeAprobacion: number;
  alumnosEvaluados: number;
  intentosFinalizados: number;
  incidenciasFoco: number;
}

export interface EstadisticasQuiz extends EstadisticasGenerales {
  quizId: string;
  nombreQuiz: string;
}

export interface EstadisticasTendencia {
  quizId: string;
  nombreQuiz: string;
  fechaFinalizacion: string;
  porcentajeAprobacion: number;
  intentosFinalizados: number;
}

export interface EstadisticasPlantel {
  plantelId: number;
  nombrePlantel: string;
  porcentajeAprobacion: number;
  alumnosEvaluados: number;
  intentosFinalizados: number;
  incidenciasFoco: number;
}
export interface DatosVistaMetricas {
  datos: EstadisticasGenerales;
  materias: EstadisticasMateria[];
  docentes: EstadisticasDocente[];
  tendencia: EstadisticasTendencia[];
  resumenGrupos: EstadisticasGrupoResumen[];
  planteles: EstadisticasPlantel[];
}