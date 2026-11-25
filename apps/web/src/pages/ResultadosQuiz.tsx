import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../services/ApiClient';
import TarjetaEstadistica from '../components/estadisticas/TarjetaEstadistica';
import GraficaResultados from '../components/estadisticas/GraficaResultados';
import GraficaIncidenciasPreguntas from '../components/estadisticas/GraficaIncidenciasPreguntas';
import ExplicacionIncidenciasFoco from '../components/estadisticas/ExplicacionIncidenciasFoco';
import MinervaMetricsAssistant from '../components/estadisticas/MinervaMetricsAssistant';
import AppPageHeader from '../components/common/AppPageHeader.tsx';

interface ResumenQuiz {
  grupoNombre: string;
  numPreguntas: number;
  numIntentos: number;
  numRespondieron: number;
  numAprobados: number;
  numReprobados: number;
  promedio: number;
  calificacionMaxima: number;
  calificacionMinima: number;
  duracionPromedioSegundos: number;
}

interface RespuestaDetalle {
  numero: number;
  preguntaId: string;
  pregunta: string;
  opcionElegida: string | null;
  opcionCorrecta: string;
  resultado: string;
  cambiosPantalla: number;
}

interface AlumnoResultado {
  alumnoId: string;
  alumnoNombre: string;
  intentoId: string;
  finalizado: boolean;
  correctas: number;
  total: number;
  calificacion: number;
  respuestas: RespuestaDetalle[];
}

interface OpcionResultado {
  id: string;
  descripcion: string;
  esCorrecta: boolean;
}

interface RespuestaPregunta {
  alumnoId: string;
  alumnoNombre: string;
  opcion: string;
  cambiosPantalla: number;
  correcta: boolean;
}

interface ResumenPregunta {
  id: string;
  numero: number;
  texto: string;
  respuestas: RespuestaPregunta[];
  aciertos: number;
  incidencias: number;
}

function formatearDuracion(segundos: number) {
  const total = Math.max(0, Math.round(segundos));
  const minutos = Math.floor(total / 60);
  return `${minutos}m ${total % 60}s`;
}

export default function ResultadosQuiz() {
  const { code, quizId } = useParams<{ code: string; quizId: string }>();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenQuiz | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoResultado[]>([]);
  const [opcionesPorPregunta, setOpcionesPorPregunta] = useState<
    Record<string, OpcionResultado[]>
  >({});
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState('');
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    let active = true;
    setCargando(true);

    async function cargar() {
      const [resumenResult, alumnosResult] = await Promise.allSettled([
        apiClient.get<ResumenQuiz>(
          `/api/quizzes/resumen/quiz/${encodeURIComponent(quizId!)}`,
        ),
        apiClient.get<AlumnoResultado[]>(
          `/api/quizzes/resumen/alumnos/quiz/${encodeURIComponent(quizId!)}`,
        ),
      ]);
      if (!active) return;

      if (resumenResult.status === 'fulfilled') {
        setResumen(resumenResult.value.data);
      }
      if (alumnosResult.status === 'fulfilled') {
        const resultados = alumnosResult.value.data;
        setAlumnos(resultados);

        const preguntaIds = [...new Set(
          resultados.flatMap((alumno) =>
            alumno.respuestas.map((respuesta) => respuesta.preguntaId),
          ),
        )].filter(Boolean);

        const opciones = await Promise.all(preguntaIds.map(async (preguntaId) => {
          try {
            const response = await apiClient.get<OpcionResultado[]>(
              `/api/opciones?preguntaId=${encodeURIComponent(preguntaId)}`,
            );
            return [preguntaId, response.data] as const;
          } catch {
            return [preguntaId, []] as const;
          }
        }));
        if (active) setOpcionesPorPregunta(Object.fromEntries(opciones));
      }
      if (resumenResult.status === 'rejected' && alumnosResult.status === 'rejected') {
        setError('No fue posible cargar los resultados del quiz.');
      }
      if (active) setCargando(false);
    }

    void cargar();
    return () => {
      active = false;
    };
  }, [quizId]);

  const preguntas = useMemo<ResumenPregunta[]>(() => {
    const porPregunta = new Map<string, ResumenPregunta>();
    for (const alumno of alumnos) {
      for (const respuesta of alumno.respuestas) {
        const id = respuesta.preguntaId || `${respuesta.numero}-${respuesta.pregunta}`;
        const actual = porPregunta.get(id) ?? {
          id,
          numero: respuesta.numero,
          texto: respuesta.pregunta,
          respuestas: [],
          aciertos: 0,
          incidencias: 0,
        };
        const correcta = respuesta.resultado === 'CORRECTA';
        actual.respuestas.push({
          alumnoId: alumno.alumnoId,
          alumnoNombre: alumno.alumnoNombre,
          opcion: respuesta.opcionElegida ?? 'Sin respuesta',
          cambiosPantalla: respuesta.cambiosPantalla,
          correcta,
        });
        if (correcta) actual.aciertos += 1;
        actual.incidencias += respuesta.cambiosPantalla;
        porPregunta.set(id, actual);
      }
    }
    return [...porPregunta.values()].sort((a, b) => a.numero - b.numero);
  }, [alumnos]);

  const preguntaActiva = preguntas.find(
    (pregunta) => pregunta.id === preguntaSeleccionada,
  );

  const opciones = useMemo(() => {
    if (!preguntaActiva) return [];
    const catalogo = opcionesPorPregunta[preguntaActiva.id] ?? [];
    const nombres = [...new Set([
      ...catalogo.map((opcion) => opcion.descripcion),
      ...preguntaActiva.respuestas.map((respuesta) => respuesta.opcion),
    ])];
    return nombres.map((nombre) => {
      const respuestas = preguntaActiva.respuestas.filter(
        (respuesta) => respuesta.opcion === nombre,
      );
      const catalogoOpcion = catalogo.find(
        (opcion) => opcion.descripcion === nombre,
      );
      return {
        nombre,
        respuestas,
        porcentaje: preguntaActiva.respuestas.length === 0
          ? 0
          : (respuestas.length * 100) / preguntaActiva.respuestas.length,
        correcta: catalogoOpcion?.esCorrecta
          ?? respuestas.some((respuesta) => respuesta.correcta),
      };
    });
  }, [opcionesPorPregunta, preguntaActiva]);

  const respuestasOpcion = opciones.find(
    (opcion) => opcion.nombre === opcionSeleccionada,
  )?.respuestas ?? [];

  return (
    <>
    <AppPageHeader title="Resultados del quiz" />
    <main className="container-fluid p-4" style={{ backgroundColor: 'var(--seige-fondo)', minHeight: '100%' }}>
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none mb-4"
        onClick={() => navigate(`/grupos/${code}`)}
      >
        <i className="bi bi-arrow-left me-2" />
        {resumen?.grupoNombre ?? 'Grupo'}
      </button>

      <header className="mb-4">
        <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Resultados del quiz
        </h1>
        <p className="mb-0 text-secondary">
          Selecciona una pregunta y después una opción para ver su desglose.
        </p>
      </header>

      {cargando ? (
        <p className="text-secondary">Cargando resultados...</p>
      ) : error ? (
        <p className="alert alert-danger" role="alert">{error}</p>
      ) : (
        <>
          {resumen && (
            <section className="row g-3 mb-4">
              {[
                ['Promedio', `${resumen.promedio.toFixed(1)}%`, 'Calificación promedio del quiz'],
                ['Respondieron', `${resumen.numRespondieron}/${resumen.numIntentos}`, 'Alumnos que finalizaron'],
                ['Preguntas', resumen.numPreguntas, 'Preguntas asociadas'],
                ['Duración promedio', formatearDuracion(resumen.duracionPromedioSegundos), 'Tiempo de resolución'],
              ].map(([label, value, description]) => (
                <article className="col-6 col-lg-3" key={label}>
                  <TarjetaEstadistica
                    titulo={String(label)}
                    valor={value}
                    descripcion={String(description)}
                  />
                </article>
              ))}
            </section>
          )}

          {resumen && (
            <section className="row g-3 mb-4">
              <article className="col-12 col-xl-6">
                <GraficaResultados
                  aprobados={resumen.numAprobados}
                  reprobados={resumen.numReprobados}
                  sinResponder={Math.max(
                    0,
                    resumen.numIntentos - resumen.numRespondieron,
                  )}
                />
              </article>
              <article className="col-12 col-xl-6">
                <GraficaIncidenciasPreguntas preguntas={preguntas} />
              </article>
            </section>
          )}

          <section className="row g-4 align-items-start">
            <article className="col-12 col-xl-8">
              <h2 className="h5 fw-bold mb-3">Desglose por pregunta</h2>
              {preguntas.map((pregunta) => {
                const porcentajeAciertos = pregunta.respuestas.length === 0
                  ? 0
                  : (pregunta.aciertos * 100) / pregunta.respuestas.length;
                const abierta = pregunta.id === preguntaSeleccionada;
                return (
                  <article key={pregunta.id} className="card bg-white border rounded-3 shadow-sm mb-3">
                    <button
                      type="button"
                      className="card-body border-0 bg-transparent text-start d-flex align-items-center gap-3 w-100"
                      onClick={() => {
                        const seCierra =
                          preguntaSeleccionada === pregunta.id;
                        setPreguntaSeleccionada(seCierra ? '' : pregunta.id);
                        setOpcionSeleccionada('');
                      }}
                    >
                      <article className="d-flex flex-wrap justify-content-between gap-3 flex-grow-1">
                        <span className="fw-semibold flex-grow-1">
                          {pregunta.numero}. {pregunta.texto}
                        </span>
                        <article className="d-flex gap-3 small">
                          <span className="text-success fw-semibold">
                            {porcentajeAciertos.toFixed(1)}% aciertos
                          </span>
                          <span className="text-danger">
                            {pregunta.incidencias} incidencias
                          </span>
                        </article>
                      </article>
                      <i className={`bi ${
                        abierta ? 'bi-chevron-up' : 'bi-chevron-down'
                      } flex-shrink-0 text-secondary`} />
                    </button>

                    {abierta && (
                      <article className="border-top p-3 bg-white">
                        <div className="d-flex flex-column gap-2">
                          {opciones.map((opcion) => (
                            <button
                              type="button"
                              key={opcion.nombre}
                              className={`btn text-start d-flex justify-content-between align-items-center gap-3 ${
                                opcionSeleccionada === opcion.nombre
                                  ? 'btn-primary'
                                  : 'btn-outline-secondary'
                              }`}
                              onClick={() => setOpcionSeleccionada(
                                opcionSeleccionada === opcion.nombre
                                  ? ''
                                  : opcion.nombre,
                              )}
                            >
                              <span>
                                {opcion.nombre}
                                {opcion.correcta && (
                                  <span className="badge bg-success ms-2">Correcta</span>
                                )}
                              </span>
                              <span className="fw-semibold">
                                {opcion.respuestas.length} · {opcion.porcentaje.toFixed(1)}%
                              </span>
                            </button>
                          ))}
                        </div>

                        {opcionSeleccionada && (
                          <article className="mt-3">
                            <h3 className="h6 fw-bold">
                              Alumnos que seleccionaron “{opcionSeleccionada}”
                            </h3>
                            {respuestasOpcion.length === 0 ? (
                              <p className="small text-secondary mb-0">Nadie seleccionó esta opción.</p>
                            ) : (
                              <article className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                  <thead><tr><th>Alumno</th><th className="text-end">Cambios de pantalla</th></tr></thead>
                                  <tbody>
                                    {respuestasOpcion.map((respuesta) => (
                                      <tr key={respuesta.alumnoId}>
                                        <td>{respuesta.alumnoNombre}</td>
                                        <td className="text-end">{respuesta.cambiosPantalla}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </article>
                            )}
                          </article>
                        )}
                      </article>
                    )}
                  </article>
                );
              })}
            </article>

            <aside className="col-12 col-xl-4">
              <article className="card bg-white border rounded-3 shadow-sm">
                <article className="card-body bg-white p-3">
                  <h2 className="h6 fw-bold mb-3">Resultados por alumno</h2>
                  <article className="table-responsive">
                    <table
                      className="table table-sm align-middle mb-0"
                      style={{ '--bs-table-bg': '#fff' } as React.CSSProperties}
                    >
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th className="text-end">Promedio</th>
                          <th className="text-end">Cambios</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnos.map((alumno) => {
                          const cambios = alumno.respuestas.reduce(
                            (total, respuesta) =>
                              total + respuesta.cambiosPantalla,
                            0,
                          );
                          return (
                            <tr key={alumno.intentoId}>
                              <td>
                                <span className="d-block fw-semibold">{alumno.alumnoNombre}</span>
                                <small className="text-secondary">
                                  {alumno.correctas}/{alumno.total}
                                </small>
                              </td>
                              <td className={`text-end fw-semibold ${
                                alumno.calificacion >= 70 ? 'text-success' : 'text-danger'
                              }`}>
                                {alumno.calificacion.toFixed(1)}%
                              </td>
                              <td className="text-end">{cambios}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </article>
                </article>
              </article>
            </aside>
          </section>

          <section className="mt-4">
            <ExplicacionIncidenciasFoco />
          </section>
          <MinervaMetricsAssistant scope="QUIZ" entityId={quizId} />
        </>
      )}
    </main>
    </>
  );
}
