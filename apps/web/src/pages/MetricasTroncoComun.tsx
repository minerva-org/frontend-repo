import { useEffect, useState } from 'react';

import ExplicacionIncidenciasFoco from '../components/estadisticas/ExplicacionIncidenciasFoco';
import MinervaMetricsAssistant from '../components/estadisticas/MinervaMetricsAssistant';
import VistaDirectorPlantel from '../components/estadisticas/vistas/VistaDirectorPlantel';
import VistaCoordinador from '../components/estadisticas/vistas/VistaCoordinador';
import VistaDireccionGeneral from '../components/estadisticas/vistas/VistaDirectorGeneral.tsx';

import { useAuth } from '../context/AuthContext.tsx';

import {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasMaterias,
  obtenerEstadisticasDocentes,
  obtenerTendenciaAprobacion,
  obtenerResumenGrupos,
  obtenerEstadisticasPlanteles,
} from '../services/estadisticasService';

import type {
  EstadisticasGenerales,
  EstadisticasMateria,
  EstadisticasDocente,
  EstadisticasTendencia,
  EstadisticasGrupoResumen,
  EstadisticasPlantel,
  DatosVistaMetricas,
} from '../types/EstadisticasTypes';

const estiloPanel = {
  backgroundColor: 'var(--seige-superficie)',
  borderColor: 'var(--seige-borde)',
};

const estiloEtiqueta = {
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
  color: 'var(--seige-texto-secundario)',
};

export default function MetricasTroncoComun() {
  const { role } = useAuth();
  const [generales, setGenerales] = useState<EstadisticasGenerales | null>(null);
  const [materias, setMaterias] = useState<EstadisticasMateria[]>([]);
  const [docentes, setDocentes] = useState<EstadisticasDocente[]>([]);
  const [tendencia, setTendencia] = useState<EstadisticasTendencia[]>([]);
  const [resumenGrupos, setResumenGrupos] = useState<EstadisticasGrupoResumen[]>([]);
  const [planteles, setPlanteles] = useState<EstadisticasPlantel[]>([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setCargando(true);
        setError('');

        const [resGenerales, resMaterias, resDocentes, resTendencia, resGrupos, resPlanteles] =
          await Promise.allSettled([
            obtenerEstadisticasGenerales(),
            obtenerEstadisticasMaterias(),
            obtenerEstadisticasDocentes(),
            obtenerTendenciaAprobacion(),
            obtenerResumenGrupos(),
            obtenerEstadisticasPlanteles(),
          ]);

        if (resGenerales.status === 'fulfilled') {
          setGenerales(resGenerales.value);
        } else {
          console.error('Error al cargar estadísticas:', resGenerales.reason);
          setError('No fue posible cargar las estadísticas generales.');
        }

        if (resMaterias.status === 'fulfilled') {
          setMaterias(resMaterias.value);
        } else {
          console.error('Error al cargar materias:', resMaterias.reason);
        }

        if (resDocentes.status === 'fulfilled') {
          setDocentes(resDocentes.value);
        } else {
          console.error('Error al cargar docentes:', resDocentes.reason);
        }

        if (
          resGenerales.status === 'fulfilled' &&
          (resMaterias.status === 'rejected' || resDocentes.status === 'rejected')
        ) {
          setError('Algunos paneles no pudieron cargarse.');
        }

        if (resTendencia.status === 'fulfilled') {
          setTendencia(resTendencia.value);
        } else {
          console.error('Error al cargar tendencia:', resTendencia.reason);
        }

        if (resGrupos.status === 'fulfilled') {
          setResumenGrupos(resGrupos.value);
        } else {
          console.error('Error al cargar resumen de grupos:', resGrupos.reason);
        }

        if (resPlanteles.status === 'fulfilled') {
          setPlanteles(resPlanteles.value);
        } else {
          console.error('Error al cargar planteles:', resPlanteles.reason);
        }
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, []);

  if (cargando) {
    return (
      <main
        className="container-fluid d-flex align-items-center justify-content-center p-5"
        style={{
          backgroundColor: 'var(--seige-fondo)',
          color: 'var(--seige-texto-secundario)',
        }}
      >
        Cargando estadísticas...
      </main>
    );
  }

  if (!generales) {
    return (
      <main
        className="container-fluid p-4"
        style={{ backgroundColor: 'var(--seige-fondo)' }}
      >
        <h1 className="h3 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
          Estadísticas
        </h1>

        <p
          className="mt-3 rounded-3 p-3 small"
          style={{
            backgroundColor: 'var(--seige-error-fondo)',
            color: 'var(--seige-error-texto)',
          }}
        >
          {error || 'No hay estadísticas disponibles.'}
        </p>
      </main>
    );
  }

  const datos: EstadisticasGenerales = generales;

  const vistaProps: DatosVistaMetricas = {
    datos,
    materias,
    docentes,
    tendencia,
    resumenGrupos,
    planteles,
  };

  const subtitulo = 'Visión general de las evaluaciones';

  const renderVistaGeneral = () => {
    if (role === 'directorGeneral' || role === 'dev') {
      return <VistaDireccionGeneral {...vistaProps} />;
    }
    if (role === 'coordinador' || role === 'docente') {
      return <VistaCoordinador {...vistaProps} esDocente={role === 'docente'} />;
    }
    return <VistaDirectorPlantel {...vistaProps} />;
  };

  return (
    <main
      className="container-fluid p-4"
      style={{
        backgroundColor: 'var(--seige-fondo)',
        color: 'var(--seige-texto)',
        minHeight: '100%',
      }}
    >
      {/* ENCABEZADO */}
      <header className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <article>
          <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
            Estadísticas de quizzes
          </h1>
          <p className="mb-0 small" style={{ color: 'var(--seige-texto-secundario)' }}>
            {subtitulo}
          </p>
        </article>

      </header>

      {/* MENSAJE DE ERROR */}
      {error && (
        <p
          className="rounded-3 p-3 small mb-4"
          style={{
            backgroundColor: 'var(--seige-error-fondo)',
            color: 'var(--seige-error-texto)',
          }}
        >
          {error}
        </p>
      )}

      {renderVistaGeneral()}

      {/* RESUMEN DE INTENTOS */}
      <section className="card border rounded-3 shadow-sm mb-4" style={estiloPanel}>
        <article className="card-body p-3">
          <h2 className="h6 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
            Resumen de intentos
          </h2>
          <p className="small mb-3" style={{ color: 'var(--seige-texto-secundario)' }}>
            Detalle de los intentos finalizados.
          </p>

          <article className="row g-3 text-center">
            <article className="col-6 col-md">
              <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                Intentos finalizados
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                {datos.intentosFinalizados}
              </p>
            </article>

            <article className="col-6 col-md">
              <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                Aprobados
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--seige-exito)' }}>
                {datos.intentosAprobados}
              </p>
            </article>

            <article className="col-6 col-md">
              <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                Reprobados
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--seige-alerta)' }}>
                {datos.intentosReprobados}
              </p>
            </article>

            <article className="col-6 col-md">
              <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                % Aprobados
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                {datos.porcentajeAprobacion.toFixed(1)}%
              </p>
            </article>

            <article className="col-6 col-md">
              <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                % Reprobados
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                {datos.porcentajeReprobacion.toFixed(1)}%
              </p>
            </article>

          </article>
        </article>
      </section>

      <section className="mt-4">
        <ExplicacionIncidenciasFoco />
      </section>
      {(role === 'directorGeneral' || role === 'dev') && (
        <MinervaMetricsAssistant scope="INSTITUCION" />
      )}
      {(role === 'directorPlantel' || role === 'coordinador') && (
        <MinervaMetricsAssistant scope="PLANTEL" />
      )}
    </main>
  );
}