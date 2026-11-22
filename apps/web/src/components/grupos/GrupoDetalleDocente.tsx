import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCatalogCard, { getQuizCatalogState } from '../quizzes/QuizCatalogCard.tsx';
import { apiClient } from '../../services/ApiClient';
import {
  fetchPersonasByPlantelAndRol,
  fetchPersonasPaginadas,
} from '../../services/personaService.ts';
import type { PersonaRecord } from '../../types/PersonaTypes.ts';
import type { GrupoDetalleBackend, AlumnoEntry, QuizCatalogBackend } from '../../types/GrupoTypes.ts';
import AgregarAlumnosForm from '../grupos/AgregarAlumnosForm.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import Toast, {type ToastData} from '../common/Toast';

function toDateValue(value?: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function sortQuizCatalogDesc(a: QuizCatalogBackend, b: QuizCatalogBackend): number {
  const aDate = Math.max(toDateValue(a.fechaInicio), toDateValue(a.fechaFinalizacion), toDateValue(a.fechaCreacion));
  const bDate = Math.max(toDateValue(b.fechaInicio), toDateValue(b.fechaFinalizacion), toDateValue(b.fechaCreacion));
  return bDate - aDate;
}

export default function GrupoDetalleDocente({ code }: { code: string }) {
  const { role } = useAuth();

  const PuedeManejar = role !== 'directorGeneral' && role !== 'directorPlantel';

  const [tab, setTab] = useState<'general' | 'settings'>('general');
  const [copiado, setCopiado] = useState(false);
  const [modalAgregarAlumnos, setModalAgregarAlumnos] = useState(false);
  const [loading, setLoading] = useState(true);

  const [grupo, setGrupo] = useState<GrupoDetalleBackend | null>(null);
  const [docenteNombre, setDocenteNombre] = useState('—');
  const [alumnos, setAlumnos] = useState<AlumnoEntry[]>([]);
  const [quizzes, setQuizzes] = useState<QuizCatalogBackend[]>([]);
  const [quizTab, setQuizTab] = useState<'proximos' | 'pasados'>('proximos');
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [quizPorBorrar, setQuizPorBorrar] = useState<{id: string; nombre: string;} | null>(null);
  const [quizEliminando, setQuizEliminando] = useState(false);

  const [toast, setToast] = useState<ToastData | null>(null);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<PersonaRecord[]>([]);
  const cerrarToast = useCallback(() => { setToast(null);}, []);

  const [segundosRestantes, setSegundosRestantes] = useState(10);
  const navigate = useNavigate();
  const [docentesDisponibles, setDocentesDisponibles] = useState<PersonaRecord[]>([]);
  const [modalAsignarDocente, setModalAsignarDocente] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('');
  const [asignandoDocente, setAsignandoDocente] = useState(false);
  

  useEffect(()=>{
    if(!quizPorBorrar) return;

    const timer = window.setInterval(() => {
      setSegundosRestantes((actual) => {
        if (actual <= 1){
          window.clearInterval(timer);
          return 0;
        }
        return actual -1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quizPorBorrar]);

  useEffect(() => {

    let cancelled = false;
    async function load() {
      try {
        const grupoResponse =
          await apiClient.get<GrupoDetalleBackend>(`/api/grupos/${code}`);

        if (cancelled) return;

        const nextGrupo = grupoResponse.data;
        let disponibles: PersonaRecord[] = [];
        let docentes: PersonaRecord[] = [];
        let docente: PersonaRecord | undefined;
        let alumnoList: PersonaRecord[] = [];

        if (nextGrupo.plantelId !== null) {
          const [docentesResponse, alumnosResponse] = await Promise.all([
            fetchPersonasPaginadas(
              nextGrupo.plantelId,
              ['DOCENTE', 'COORDINADOR'],
              0,
              100,
              true,
            ),
            fetchPersonasByPlantelAndRol(
              nextGrupo.plantelId,
              'ALUMNO',
            ),
          ]);

          if (cancelled) return;

          const docentesActivos = docentesResponse.data.content;
          docente = docentesActivos.find(
            (persona) => persona.id === nextGrupo.docenteId,
          );
          if (!nextGrupo.docenteId) {
            docentes = docentesActivos;
          }

          const alumnoIds = nextGrupo.alumnosIds ?? [];
          alumnoList = (alumnosResponse.data ?? []).filter(
            (persona) => alumnoIds.includes(persona.id),
          );
          disponibles = (alumnosResponse.data ?? []).filter(
            (persona) =>
              persona.activo &&
              !(nextGrupo.alumnosIds ?? []).includes(persona.id),
          );
        }

        setDocentesDisponibles(docentes);
        setAlumnosDisponibles(disponibles);
        setGrupo(nextGrupo);
        setDocenteNombre(
          nextGrupo.docenteId && docente
            ? `${docente.nombre} ${docente.apellidoPaterno} ${docente.apellidoMaterno ?? ''}`.trim()
            : 'Pendiente por asignar',
        );
        setAlumnos(
          alumnoList.map((persona) => ({
            id: persona.id,
            nombre: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno ?? ''}`.trim(),
            estado: 'normal',
          })),
        );
      } catch {
        if (!cancelled) {
          setGrupo(null);
          setAlumnos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadQuizzes() {
      try {
        setQuizLoading(true);
        setQuizError(null);

        const endpoints = [
          `/api/quizzes?grupoId=${encodeURIComponent(code)}`,
          `/api/grupos/${code}/quizzes`,
          `/api/quizzes?grupo=${encodeURIComponent(code)}`,
        ];

        let nextQuizzes: QuizCatalogBackend[] = [];

        for (const endpoint of endpoints) {
          try {
            const response = await apiClient.get<QuizCatalogBackend[]>(endpoint);
            const data = Array.isArray(response.data) ? response.data : [];
            nextQuizzes = data;
            if (data.length > 0 || response.status === 200) {
              break;
            }
          } catch {
            // intenta con el siguiente endpoint
          }
        }

        if (!cancelled) {
          setQuizzes(nextQuizzes.sort(sortQuizCatalogDesc));
        }
      } catch {
        if (!cancelled) {
          setQuizzes([]);
          setQuizError('No se pudieron cargar los quizzes de este grupo.');
        }
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    }

    void load();
    void loadQuizzes();
    return () => { cancelled = true; };
  }, [code]);

  async function handleAsignarDocente() {
    if (!grupo || !docenteSeleccionado || asignandoDocente) return;

    const docente = docentesDisponibles.find(
      (persona) => persona.id === docenteSeleccionado
    );

    if (!docente || !docente.activo) return;

    try {
      setAsignandoDocente(true);

      await apiClient.patch(`/api/grupos/${grupo.id}`, {
        docenteId: docente.id,
      });

      setGrupo((prev) =>
        prev
          ? { ...prev, docenteId: docente.id }
          : prev
      );

      setDocenteNombre(
        `${docente.nombre} ${docente.apellidoPaterno} ${docente.apellidoMaterno ?? ''}`.trim()
      );

      setDocentesDisponibles((prev) =>
        prev.filter((persona) => persona.id !== docente.id)
      );

      setModalAsignarDocente(false);
      setDocenteSeleccionado('');

      setToast({
        mensaje: 'El docente se asignó correctamente al grupo.',
        tipo: 'exito',
      });
    } catch (error) {
      console.error('Error al asignar docente:', error);

      setToast({
        mensaje: 'No se pudo asignar el docente. Intenta nuevamente.',
        tipo: 'error',
      });
    } finally {
      setAsignandoDocente(false);
    }
  }

  const quizCatalog = useMemo(() => {
    return [...quizzes].sort(sortQuizCatalogDesc).map((quiz) => ({ ...quiz, estado: getQuizCatalogState(quiz) }));
  }, [quizzes]);

  const quizzesProximos = useMemo(
    () => quizCatalog.filter((quiz) => quiz.estado !== 'pasado').sort((a, b) => toDateValue(b.fechaInicio) - toDateValue(a.fechaInicio)),
    [quizCatalog],
  );

  const quizzesPasados = useMemo(
    () => quizCatalog.filter((quiz) => quiz.estado === 'pasado').sort((a, b) => toDateValue(b.fechaFinalizacion) - toDateValue(a.fechaFinalizacion)),
    [quizCatalog],
  );

  function handleBorrarQuiz(id: string, titulo: string) {
    setSegundosRestantes(10);
    setQuizPorBorrar({id, nombre: titulo});
  }

  async function confirmarBorrarQuiz() {
    if(!quizPorBorrar || quizEliminando || segundosRestantes > 0) return;

    const { id } = quizPorBorrar;
    try{
      setQuizEliminando(true);

      await apiClient.delete(`/api/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((q)=> q.id !== id));
      setExpandedQuizId((current) => current === id ? null : current);

      setQuizPorBorrar(null);
      setToast({
        mensaje: 'El quiz se elimino correctamente.',
        tipo: 'exito'
      });
    } catch(error){
      console.error('Error al eliminar el quiz:', error);
      setToast({
        mensaje: 'No se pudo eliminar el quiz. Intenta nuevamente.',
        tipo: 'error'
      });

    } finally{
      setQuizEliminando(false);
    }
  }

  function handleAprove(id: string) {
    setAlumnos((prev) => prev.map((a) => (a.id === id ? { ...a, estado: 'normal' as const } : a)));
  }

  function handleReject(id: string) {
    setAlumnos((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCopiarCodigo() {
    if (!grupo) return;
    navigator.clipboard?.writeText(grupo.claveGrupo).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  async function handleAgregarAlumnos(alumnosIds: string[]) {
    if (!grupo || alumnosIds.length === 0) return;

    const agregados: string[] = [];

    try {
      for (const alumnoId of alumnosIds) {
        await apiClient.post(
          `/api/grupos/${grupo.id}/alumnos/${alumnoId}`
        );

        agregados.push(alumnoId);
      }

      const nuevos = alumnosDisponibles
        .filter((persona) => agregados.includes(persona.id))
        .map((persona) => ({
          id: persona.id,
          nombre: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno ?? ''}`.trim(),
          estado: 'normal' as const,
        }));

      setAlumnos((prev) => [...prev, ...nuevos]);

      setAlumnosDisponibles((prev) =>
        prev.filter((persona) => !agregados.includes(persona.id))
      );

      setModalAgregarAlumnos(false);

      setToast({
        mensaje: 'Los alumnos se agregaron correctamente al grupo.',
        tipo: 'exito',
      });

    } catch (error) {
      console.error('Error al agregar alumnos:', error);

      const nuevos = alumnosDisponibles
        .filter((persona) => agregados.includes(persona.id))
        .map((persona) => ({
          id: persona.id,
          nombre: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno ?? ''}`.trim(),
          estado: 'normal' as const,
        }));

      setAlumnos((prev) => [...prev, ...nuevos]);

      setAlumnosDisponibles((prev) =>
        prev.filter((persona) => agregados.includes(persona.id) === false)
      );

      setToast({
        mensaje: agregados.length > 0
          ? `Se guardaron ${agregados.length} alumnos, pero algunos no pudieron agregarse.`
          : 'No se pudieron agregar los alumnos. Intenta nuevamente.',
        tipo: 'error',
      });
    }
  }

  if (loading) return <p className="text-center text-secondary py-4 mb-0">Cargando grupo...</p>;
  if (!grupo) return <p className="text-center text-secondary py-4 mb-0">Grupo no encontrado.</p>;

  return (
    <>
      {modalAsignarDocente && (
        <article
          className="modal show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
        >
          <article className="modal-dialog modal-dialog-centered">
            <article className="modal-content border-0 shadow">
              <article className="modal-header">
                <h5 className="modal-title fw-bold">Asignar docente</h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalAsignarDocente(false)}
                  disabled={asignandoDocente}
                  aria-label="Cerrar"
                />
              </article>

              <article className="modal-body">
                <label className="form-label fw-semibold">
                  Selecciona un docente
                </label>

                <select
                  className="form-select"
                  value={docenteSeleccionado}
                  onChange={(event) => setDocenteSeleccionado(event.target.value)}
                >
                  <option value="">Selecciona un docente</option>

                  {docentesDisponibles.map((docente) => (
                    <option key={docente.id} value={docente.id}>
                      {docente.nombre} {docente.apellidoPaterno}{' '}
                      {docente.apellidoMaterno ?? ''}
                    </option>
                  ))}
                </select>

                {docentesDisponibles.length === 0 && (
                  <p className="text-secondary mt-2 mb-0">
                    No hay docentes activos disponibles en este plantel.
                  </p>
                )}
              </article>

              <article className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setModalAsignarDocente(false)}
                  disabled={asignandoDocente}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAsignarDocente}
                  disabled={!docenteSeleccionado || asignandoDocente}
                >
                  {asignandoDocente ? 'Asignando...' : 'Asignar docente'}
                </button>
              </article>
            </article>
          </article>
        </article>
      )}

      {quizPorBorrar && (
        <article
          className="modal show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gd-delete-title"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
        >
          <article className="modal-dialog modal-dialog-centered">
            <article className="modal-content border-0 shadow">
              <article className="modal-body text-center p-4">
                <article className="mb-3">
                  <i className="bi bi-trash3 text-danger fs-1" />
                </article>

                <h5 className="modal-title fw-bold mb-3" id="gd-delete-title">
                  ¿Eliminar quiz?
                </h5>

                <p className="text-secondary mb-4">
                  ¿Estás seguro de que deseas eliminar
                  <strong> {quizPorBorrar.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>

                <article className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setQuizPorBorrar(null)}
                    disabled={quizEliminando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarBorrarQuiz}
                    disabled={quizEliminando || segundosRestantes > 0}
                  >
                    {quizEliminando
                      ? 'Eliminando...'
                      : segundosRestantes > 0
                        ? `Eliminar (${segundosRestantes})`
                        : 'Eliminar'}
                  </button>
                </article>
              </article>
            </article>
          </article>
        </article>
      )}

      <Toast toast={toast} onCerrar={cerrarToast} />

      {modalAgregarAlumnos && (
        <AgregarAlumnosForm
          grupoId={grupo.id}
          alumnos={alumnosDisponibles}
          alumnosSeleccionados={alumnos.map((alumno) => alumno.id)}
          onCancel={() => setModalAgregarAlumnos(false)}
          onSubmit={handleAgregarAlumnos}
        />
      )}

      {/* Encabezado del grupo */}
      <section className="bg-primary bg-gradient text-white rounded-4 shadow-sm p-4 p-md-4">
        <article className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3">
          <article className="min-w-0">
            <span className="badge bg-white bg-opacity-25 text-white mb-2">
              <i className="bi bi-people-fill me-1" />
              Grupo
            </span>

            <h1 className="fs-3 fw-bold mb-1 text-break">
              {grupo.nombre}
            </h1>

            <p className="mb-0 text-white-50">
              Ciclo: {grupo.semestre}
            </p>
          </article>

          <span className="badge bg-white bg-opacity-25 text-white fs-6 px-3 py-2">
            {grupo.claveGrupo}
          </span>
        </article>
      </section>

      {/* Información y navegación */}
      <section className="bg-white border rounded-4 shadow-sm p-3 p-md-4">
        <article className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <article className="d-flex flex-column flex-sm-row flex-wrap gap-3">
            <article>
              <small className="text-secondary d-block">Grupo</small>
              <span className="fw-semibold">{grupo.nombre}</span>
            </article>

            <article>
              <small className="text-secondary d-block">Docente</small>

              <article className="d-flex flex-wrap align-items-center gap-2">
                <span className="fw-semibold">
                  {grupo.docenteId ? docenteNombre : 'Pendiente por asignar'}
                </span>

                {!grupo.docenteId && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setModalAsignarDocente(true)}
                    disabled={docentesDisponibles.length === 0}
                  >
                    <i className="bi bi-person-plus me-1" />
                    Agregar docente
                  </button>
                )}
              </article>
            </article>

            <article>
              <small className="text-secondary d-block">Clave del grupo</small>

              <article className="d-flex align-items-center gap-2">
                <span className="fw-semibold font-monospace">
                  {grupo.claveGrupo}
                </span>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleCopiarCodigo}
                  title="Copiar clave"
                  aria-label="Copiar clave del grupo"
                >
                  <i className={`bi ${copiado ? 'bi-check-lg text-success' : 'bi-clipboard'}`} />
                </button>


                {copiado && (
                  <small className="text-success">Copiado</small>
                )}

                
              </article>
            </article>
          </article>
           <nav className="nav nav-pills gap-2 bg-body-secondary rounded-3 p-1 overflow-x-auto">
              <button
                type="button"
                className={`nav-link d-inline-flex align-items-center gap-2 text-nowrap ${tab === 'general' ? 'active' : 'text-body'}`}
                onClick={() => setTab('general')}
              >
                <i className="bi bi-card-list" />
                General
              </button>

              <button
                type="button"
                className={`nav-link d-inline-flex align-items-center gap-2 text-nowrap ${tab === 'settings' ? 'active' : 'text-body'}`}
                onClick={() => setTab('settings')}
              >
                <i className="bi bi-gear" />
                Settings de Grupo y Examen
              </button>
            </nav>
        </article>
      </section>

      {tab === 'settings' ? (
        <section className="bg-white border rounded-4 shadow-sm p-4">
          <article className="text-center py-4">
            <i className="bi bi-gear fs-1 text-secondary d-block mb-3" />
            <p className="text-secondary mb-0">
              Settings de grupo y examen — en construcción.
            </p>
          </article>
        </section>
      ) : (
        <article className="row g-3 align-items-start">
          {/* Gestión de quizzes*/}
          <article className="col-12 col-lg-8">
            <section className="bg-white border rounded-4 shadow-sm p-3 p-md-4 h-100">
              <article className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <h2 className="fs-5 fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-journal-text text-primary" />
                  Gestión de Quizzes
                </h2>

                {PuedeManejar && (
                  <button
                    type="button"
                    className="btn bg-secondary text-light btn-sm"
                    onClick={() => navigate(`/grupos/${code}/quizzes/nuevo`)}
                  >
                    <i className="bi bi-plus-lg me-1" />
                    Nuevo Quiz
                  </button>
                )}
              </article>

              <nav className="nav nav-pills nav-fill gap-2 bg-body-secondary rounded-3 p-1 mb-3">
                <button
                  type="button"
                  className={` nav-link ${quizTab === 'proximos' ? 'active bg-secondary' : 'text-body'}` }
                  onClick={() => setQuizTab('proximos')}
                >
                  Próximos
                  <span className="badge bg-white bg-opacity-25 ms-2">
                    {quizzesProximos.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`nav-link ${quizTab === 'pasados' ? 'active bg-secondary' : 'text-body'}`}
                  onClick={() => setQuizTab('pasados')} >
                  Pasados
                  <span className="badge bg-white bg-opacity-25 ms-2">
                    {quizzesPasados.length}
                  </span>
                </button>
              </nav>

              {quizLoading ? (
                <article className="text-center text-secondary py-5">
                  <article className="spinner-border spinner-border-sm me-2" role="status" />
                  Cargando quizzes del grupo...
                </article>
              ) : quizError ? (
                <article className="alert alert-danger mb-0" role="alert">
                  <i className="bi bi-exclamation-circle me-2" />
                  {quizError}
                </article>
              ) : (quizTab === 'proximos' ? quizzesProximos : quizzesPasados).length === 0 ? (
                <article className="text-center text-secondary py-5">
                  <i className="bi bi-journal-x fs-1 d-block mb-3" />
                  <p className="mb-0">
                    {quizTab === 'proximos'
                      ? 'No hay quizzes próximos para este grupo.'
                      : 'No hay quizzes pasados para este grupo.'}
                  </p>
                </article>
              ) : (
                <article className="d-flex flex-column gap-3">
                  {(quizTab === 'proximos' ? quizzesProximos : quizzesPasados).map((quiz) => (
                    <QuizCatalogCard
                      key={quiz.id}
                      quiz={quiz}
                      expanded={expandedQuizId === quiz.id}
                      onToggleExpand={(quizId) =>
                        setExpandedQuizId((current) => current === quizId ? null : quizId)
                      }
                      onEdit={(quizId) =>
                        navigate(`/grupos/${code}/quizzes/${quizId}/editar`)
                      }
                      onDelete={handleBorrarQuiz}
                      PuedeManejar={PuedeManejar}
                    />
                  ))}
                </article>
              )}
            </section>
          </article>

          {/* Lista de alumnos */}
          <article className="col-12 col-lg-4">
            <section className="bg-white border rounded-4 shadow-sm p-3 p-md-4 h-100">
              <article className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <h2 className="fs-5 fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-people text-primary" />
                  Alumnos
                  <span className="badge bg-primary rounded-pill">
                    {alumnos.length}
                  </span>
                </h2>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setModalAgregarAlumnos(true)}
                >
                  <i className="bi bi-plus-lg me-1" />
                  Agregar
                </button>
              </article>

              {alumnos.length > 0 ? (
                <article className="list-group list-group-flush">
                  {alumnos.map((a) =>
                    a.estado === 'pendiente' ? (
                      <article
                        key={a.id}
                        className="list-group-item px-2 py-3 bg-warning bg-opacity-10 rounded-3 mb-2 border"
                      >
                        <article className="d-flex align-items-center justify-content-between gap-2">
                          <article className="min-w-0">
                            <span className="fw-semibold text-break">{a.nombre}</span>
                            <small className="text-warning-emphasis d-block">
                              Solicitud pendiente
                            </small>
                          </article>

                          <article className="d-flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleAprove(a.id)}
                              title="Aprobar"
                              aria-label={`Aprobar solicitud de ${a.nombre}`}
                            >
                              <i className="bi bi-check-lg" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(a.id)}
                              title="Rechazar"
                              aria-label={`Rechazar solicitud de ${a.nombre}`}
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </article>
                        </article>
                      </article>
                    ) : (
                      <article
                        key={a.id}
                        className="list-group-item d-flex align-items-center gap-2 px-2 py-3"
                      >
                        <i className="bi bi-person-circle text-secondary fs-5" />
                        <span className="text-break">{a.nombre}</span>
                      </article>
                    )
                  )}
                </article>
              ) : (
                <article className="text-center text-secondary py-5">
                  <i className="bi bi-person-x fs-1 d-block mb-3" />
                  <p className="mb-0">Sin alumnos inscritos.</p>
                </article>
              )}
            </section>
          </article>
        </article>
      )}
    </>
  );
}