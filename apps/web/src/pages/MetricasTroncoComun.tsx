import { useEffect, useState } from 'react';

import GraficaResultados from '../components/estadisticas/GraficaResultados';
import GraficaRendimiento from '../components/estadisticas/GraficaRendimiento';
import KpisGenerales from '../components/estadisticas/KpisGenerales';
import VistaDirectorPlantel from '../components/estadisticas/vistas/VistaDirectorPlantel';
import VistaCoordinador from '../components/estadisticas/vistas/VistaCoordinador';
import VistaDireccionGeneral from '../components/estadisticas/vistas/VistaDirectorGeneral.tsx';

import { useAuth } from '../context/AuthContext.tsx';

import {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasMaterias,
  obtenerEstadisticasDocentes,
  obtenerEstadisticasGrupo,
  obtenerEstadisticasQuiz,
  obtenerTendenciaAprobacion,
  obtenerResumenGrupos,
  obtenerEstadisticasPlanteles,
} from '../services/estadisticasService';

import type {
  EstadisticasGenerales,
  EstadisticasMateria,
  EstadisticasDocente,
  EstadisticasGrupo,
  EstadisticasQuiz,
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
  const [grupo, setGrupo] = useState<EstadisticasGrupo | null>(null);
  const [quiz, setQuiz] = useState<EstadisticasQuiz | null>(null);
  const [tendencia, setTendencia] = useState<EstadisticasTendencia[]>([]);
  const [resumenGrupos, setResumenGrupos] = useState<EstadisticasGrupoResumen[]>([]);
  const [planteles, setPlanteles] = useState<EstadisticasPlantel[]>([]);

  const [grupoId, setGrupoId] = useState('');
  const [quizId, setQuizId] = useState('');

  const [cargando, setCargando] = useState(true);
  const [cargandoGrupo, setCargandoGrupo] = useState(false);
  const [cargandoQuiz, setCargandoQuiz] = useState(false);

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

  const consultarGrupo = async () => {
    const id = grupoId.trim();

    if (!id) {
      setError('Ingresa el identificador del grupo.');
      return;
    }

    try {
      setCargandoGrupo(true);
      setError('');
      setGrupo(null);
      setQuiz(null);

      const datos = await obtenerEstadisticasGrupo(id);
      setGrupo(datos);
    } catch (err) {
      console.error('Error al consultar estadísticas del grupo:', err);
      setError('No fue posible consultar las estadísticas del grupo.');
    } finally {
      setCargandoGrupo(false);
    }
  };

  const consultarQuiz = async () => {
    const id = quizId.trim();

    if (!id) {
      setError('Ingresa el identificador del quiz.');
      return;
    }

    try {
      setCargandoQuiz(true);
      setError('');
      setQuiz(null);
      setGrupo(null);

      const datos = await obtenerEstadisticasQuiz(id);
      setQuiz(datos);
    } catch (err) {
      console.error('Error al consultar estadísticas del quiz:', err);
      setError('No fue posible consultar las estadísticas del quiz.');
    } finally {
      setCargandoQuiz(false);
    }
  };

  const limpiarConsultas = () => {
    setGrupo(null);
    setQuiz(null);
    setGrupoId('');
    setQuizId('');
    setError('');
  };

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

  const datosActuales = grupo || quiz;

  const datos: EstadisticasGenerales = grupo ?? quiz ?? generales;

  const vistaProps: DatosVistaMetricas = {
    datos,
    materias,
    docentes,
    tendencia,
    resumenGrupos,
    planteles,
  };

  const subtitulo = grupo
    ? `${grupo.nombreGrupo} · ${grupo.claveGrupo} · ${grupo.semestre}`
    : quiz
      ? quiz.nombreQuiz
      : 'Visión general de las evaluaciones';

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

        {datosActuales && (
          <button
            type="button"
            onClick={limpiarConsultas}
            className="btn btn-sm btn-outline-secondary"
            style={{
              borderColor: 'var(--seige-borde)',
              color: 'var(--ar-profundo)',
              backgroundColor: 'var(--seige-superficie)',
            }}
          >
            <i className="bi bi-arrow-counterclockwise me-1" />
            Volver a la vista general
          </button>
        )}
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

      {/* VISTA POR ROL O DETALLE DE CONSULTA */}
      {datosActuales ? (
        <>
          <KpisGenerales datos={datos} />

          <section className="row g-3 mb-4">
            <article className="col-12 col-xl-6">
              <GraficaRendimiento
                promedio={datos.promedioGeneral}
                aprobacion={datos.porcentajeAprobacion}
                focoLimpio={datos.indiceFocoLimpio}
              />
            </article>

            <article className="col-12 col-xl-6">
              <GraficaResultados
                aprobados={datos.intentosAprobados}
                reprobados={datos.intentosReprobados}
              />
            </article>
          </section>
        </>
      ) : (
        renderVistaGeneral()
      )}

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
                % Aprobación
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                {datos.porcentajeAprobacion.toFixed(1)}%
              </p>
            </article>

            <article className="col-6 col-md">
              <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                % Reprobación
              </p>
              <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                {datos.porcentajeReprobacion.toFixed(1)}%
              </p>
            </article>

            {grupo && (
              <article className="col-6 col-md">
                <p className="mb-1 text-uppercase fw-semibold" style={estiloEtiqueta}>
                  Quizzes aplicados
                </p>
                <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                  {grupo.quizzesAplicados}
                </p>
              </article>
            )}
          </article>
        </article>
      </section>

      {/* CONSULTAS ESPECÍFICAS */}
      <section>
        <h2 className="h6 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Consultas específicas
        </h2>
        <p className="small mb-3" style={{ color: 'var(--seige-texto-secundario)' }}>
          Explora los resultados de un grupo o una evaluación individual.
        </p>

        <article className="row g-3">
          {/* GRUPO */}
          <article className="col-12 col-lg-6">
            <article className="card h-100 border rounded-3 shadow-sm" style={estiloPanel}>
              <article className="card-body p-3">
                <h3 className="h6 fw-semibold mb-3" style={{ color: 'var(--ar-profundo)' }}>
                  Estadísticas por grupo
                </h3>

                <article className="d-flex flex-wrap gap-2">
                  <input
                    value={grupoId}
                    onChange={(e) => setGrupoId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void consultarGrupo();
                    }}
                    placeholder="ID del grupo (ej. GRP-A)"
                    aria-label="Identificador del grupo"
                    className="form-control form-control-sm flex-grow-1 w-auto"
                    style={{ borderColor: 'var(--seige-borde)' }}
                  />

                  <button
                    type="button"
                    onClick={() => void consultarGrupo()}
                    disabled={cargandoGrupo}
                    className="btn btn-sm text-white"
                    style={{ backgroundColor: 'var(--ar-profundo)' }}
                  >
                    {cargandoGrupo ? 'Consultando...' : 'Consultar'}
                  </button>
                </article>

                {grupo && (
                  <article
                    className="row g-2 mt-3 rounded-3 p-3 small mx-0"
                    style={{ backgroundColor: 'var(--seige-fondo)' }}
                  >
                    <p className="col-sm-6 mb-1"><strong>Grupo:</strong> {grupo.nombreGrupo}</p>
                    <p className="col-sm-6 mb-1"><strong>Clave:</strong> {grupo.claveGrupo}</p>
                    <p className="col-sm-6 mb-1"><strong>Semestre:</strong> {grupo.semestre}</p>
                    <p className="col-sm-6 mb-1"><strong>Quizzes aplicados:</strong> {grupo.quizzesAplicados}</p>
                  </article>
                )}
              </article>
            </article>
          </article>

          {/* QUIZ */}
          <article className="col-12 col-lg-6">
            <article className="card h-100 border rounded-3 shadow-sm" style={estiloPanel}>
              <article className="card-body p-3">
                <h3 className="h6 fw-semibold mb-3" style={{ color: 'var(--ar-profundo)' }}>
                  Estadísticas por quiz
                </h3>

                <article className="d-flex flex-wrap gap-2">
                  <input
                    value={quizId}
                    onChange={(e) => setQuizId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void consultarQuiz();
                    }}
                    placeholder="ID del quiz"
                    aria-label="Identificador del quiz"
                    className="form-control form-control-sm flex-grow-1 w-auto"
                    style={{ borderColor: 'var(--seige-borde)' }}
                  />

                  <button
                    type="button"
                    onClick={() => void consultarQuiz()}
                    disabled={cargandoQuiz}
                    className="btn btn-sm text-white"
                    style={{ backgroundColor: 'var(--ar-profundo)' }}
                  >
                    {cargandoQuiz ? 'Consultando...' : 'Consultar'}
                  </button>
                </article>

                {quiz && (
                  <article
                    className="row g-2 mt-3 rounded-3 p-3 small mx-0"
                    style={{ backgroundColor: 'var(--seige-fondo)' }}
                  >
                    <p className="col-12 mb-1"><strong>Quiz:</strong> {quiz.nombreQuiz}</p>
                    <p className="col-12 mb-1"><strong>ID:</strong> {quiz.quizId}</p>
                  </article>
                )}
              </article>
            </article>
          </article>
        </article>
      </section>
    </main>
  );
}