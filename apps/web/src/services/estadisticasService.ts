import { apiClient } from './ApiClient';
import type { EstadisticasGenerales, EstadisticasMateria, EstadisticasDocente, 
    EstadisticasGrupo,EstadisticasQuiz, 
    EstadisticasTendencia, EstadisticasGrupoResumen, EstadisticasPlantel} from '../types/EstadisticasTypes';

export const obtenerEstadisticasGenerales = async () => {
  const { data } = await apiClient.get<EstadisticasGenerales>(
    '/api/estadisticas/quizzes'
  );
  return data;
};

export const obtenerEstadisticasMaterias = async (): Promise<EstadisticasMateria[]> => {
  const { data } = await apiClient.get<EstadisticasMateria[]>(
    '/api/estadisticas/materias'
  );
  return data;
};

export const obtenerEstadisticasDocentes = async (): Promise<EstadisticasDocente[]> => {
  const { data } = await apiClient.get<EstadisticasDocente[]>(
    '/api/estadisticas/docentes'
  );
  return data;
};


export const obtenerEstadisticasGrupo = async (grupoId: string) => {
  const { data } = await apiClient.get<EstadisticasGrupo>(
    `/api/estadisticas/grupos/${grupoId}`
  );
  return data;
};

export const obtenerEstadisticasQuiz = async (quizId: string) => {
  const { data } = await apiClient.get<EstadisticasQuiz>(
    `/api/estadisticas/quizzes/${quizId}`
  );
  return data;
};

export const obtenerTendenciaAprobacion = async (): Promise<EstadisticasTendencia[]> => {
  const { data } = await apiClient.get<EstadisticasTendencia[]>(
    '/api/estadisticas/tendencia'
  );
  return data;
};

export const obtenerResumenGrupos = async (): Promise<EstadisticasGrupoResumen[]> => {
  const { data } = await apiClient.get<EstadisticasGrupoResumen[]>(
    '/api/estadisticas/grupos'
  );
  return data;
};

export const obtenerEstadisticasPlanteles = async (): Promise<EstadisticasPlantel[]> => {
  const { data } = await apiClient.get<EstadisticasPlantel[]>(
    '/api/estadisticas/planteles'
  );
  return data;
};