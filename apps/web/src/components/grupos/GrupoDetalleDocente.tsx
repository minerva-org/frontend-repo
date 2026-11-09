import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCatalogCard, { getQuizCatalogState } from '../quizzes/QuizCatalogCard.tsx';
import { apiClient } from '../../services/ApiClient';
import { fetchPersonas, fetchPersonasByPlantelAndRol} from '../../services/personaService.ts';
import type { PersonaRecord } from '../../types/PersonaTypes.ts';
import type { GrupoDetalleBackend, AlumnoEntry, QuizCatalogBackend } from '../../types/GrupoTypes.ts';
import AgregarAlumnosForm from '../grupos/AgregarAlumnosForm.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

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

  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error';} | null>(null);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<PersonaRecord[]>([]);

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
        const [grupoResponse, personasResponse] = await Promise.all([
          apiClient.get<GrupoDetalleBackend>(`/api/grupos/${code}`),
          fetchPersonas(),
        ]);

        if (cancelled) return;

        const nextGrupo = grupoResponse.data;
        const personas = personasResponse.data ?? [];
        const docente = personas.find((persona) => persona.id === nextGrupo.docenteId);
        const alumnoIds = nextGrupo.alumnosIds ?? [];
        const alumnoList = personas.filter((persona) => alumnoIds.includes(persona.id));

        let disponibles: PersonaRecord[] = [];

        let docentes: PersonaRecord[] = [];

        if (nextGrupo.plantelId !== null && !nextGrupo.docenteId) {
          const docentesResponse = await fetchPersonasByPlantelAndRol(
            nextGrupo.plantelId,
            'DOCENTE'
          );

          docentes = (docentesResponse.data ?? []).filter(
            (persona) => persona.activo
          );
        }

        if (cancelled) return;

        setDocentesDisponibles(docentes);

        if (nextGrupo.plantelId !== null) {
          const alumnosResponse = await fetchPersonasByPlantelAndRol(
            nextGrupo.plantelId,
            'ALUMNO'
          );

          if (cancelled) return;

          disponibles = (alumnosResponse.data ?? []).filter(
            (persona) =>
              persona.activo &&
              !(nextGrupo.alumnosIds ?? []).includes(persona.id)
          );
        }

        setAlumnosDisponibles(disponibles);

        setGrupo(nextGrupo);
        setDocenteNombre( nextGrupo.docenteId && docente ? `${docente.nombre} ${docente.apellidoPaterno} ${docente.apellidoMaterno ?? ''}`.trim() : 'Pendiente por asignar');
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

  if (loading) return <p className="gd-empty">Cargando grupo...</p>;
  if (!grupo) return <p className="gd-empty">Grupo no encontrado.</p>;

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
                <h5 className="modal-title fw-bold">
                  Asignar docente
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalAsignarDocente(false)}
                  disabled={asignandoDocente}
                />
              </article>

              <article className="modal-body">
                <label className="form-label fw-semibold">
                  Selecciona un docente
                </label>

                <select
                  className="form-select"
                  value={docenteSeleccionado}
                  onChange={(event) =>
                    setDocenteSeleccionado(event.target.value)
                  }
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
                  <i className="bi bi-trash3 text-danger fs-1"></i>
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
                    {quizEliminando ? 'Eliminando...' :
                    segundosRestantes > 0 ? `Eliminar (${segundosRestantes})`
                    : 'Eliminar'}
                  </button>
                </article>
              </article>

            </article>
          </article>
        </article>
      )}

      {toast && (
        <article
          className="modal show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gd-result-title"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
        >
          <article className="modal-dialog modal-dialog-centered" role="document">
            <article className="modal-content border-0 shadow">
              <article className="modal-body text-center p-4">
                <article className="mb-3">
                  <i
                    className={`bi ${
                      toast.tipo === 'exito'
                        ? 'bi-check-circle-fill text-success'
                        : 'bi-x-circle-fill text-danger'
                    }`}
                    style={{ fontSize: '3rem' }}
                  ></i>
                </article>

                <h5 className="modal-title fw-bold mb-3" id="gd-result-title">
                  {toast.tipo === 'exito'
                    ? '¡Operacion exitosa!'
                    : 'No se pudo realizar la operacion'}
                </h5>

                <p className="text-secondary mb-4">
                  {toast.mensaje}
                </p>

                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={() => setToast(null)}
                >
                  Aceptar
                </button>
              </article>
            </article>
          </article>
        </article>
      )}

      {modalAgregarAlumnos && (
        <AgregarAlumnosForm
          alumnos={alumnosDisponibles}
          alumnosSeleccionados={alumnos.map((alumno) => alumno.id)}
          onCancel={() => setModalAgregarAlumnos(false)}
          onSubmit={handleAgregarAlumnos}
        />
      )}

      <section className="gd-hero">
        <article className="gd-hero-row">
          <h1 className="gd-hero-title">{grupo.nombre}</h1>
          <span className="gd-hero-cycle">Ciclo: {grupo.semestre}</span>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">
          <span className="gd-meta-item"><strong className="gd-meta-label">Grupo:</strong> {grupo.nombre}</span>
          <span className="gd-meta-item">
            <strong className="gd-meta-label">Docente:</strong>

            {grupo.docenteId ? (
              docenteNombre
            ) : (
              <>
                <span className="fw-semibold">
                  Pendiente por asignar
                </span>

                <button
                  type="button"
                  className="gd-btn"
                  onClick={() => setModalAsignarDocente(true)}
                  disabled={docentesDisponibles.length === 0}
                >
                  <i className="bi bi-person-plus"></i> Agregar docente
                </button>
              </>
            )}
          </span>
          <span className="gd-meta-item">
            <strong className="gd-meta-label">Clave:</strong>
            <span className="gd-code">
              {grupo.claveGrupo}
              <i
                className={`bi ${copiado ? 'bi-check-lg' : 'bi-clipboard'}`}
                onClick={handleCopiarCodigo}
                title="Copiar clave"
              ></i>
            </span>
          </span>
        </article>

        <article className="gd-tabs">
          <button className={`gd-tab ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>
            <i className="bi bi-card-list"></i> General
          </button>
          <button className={`gd-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <i className="bi bi-gear"></i> Settings de Grupo y Examen
          </button>
        </article>
      </section>

      {tab === 'settings' ? (
        <section className="gd-card">
          <p className="gd-empty">Settings de grupo y examen — en construcción.</p>
        </section>
      ) : (
        <article className="gd-grid">
          <section className="gd-card">
            <article className="gd-card-header">
              <span className="gd-card-title"><i className="bi bi-journal-text"></i> Gestión de Quizzes</span>

              {PuedeManejar && (
                <button className="gd-btn gd-btn-primary" onClick={() => navigate(`/grupos/${code}/quizzes/nuevo`)}>
                  <i className="bi bi-plus-lg"></i> Nuevo Quiz
                </button>
              )}
            </article>

            <article className="gd-quiz-tabs">
              <button
                type="button"
                className={`gd-quiz-tab ${quizTab === 'proximos' ? 'active' : ''}`}
                onClick={() => setQuizTab('proximos')}
              >
                Próximos
              </button>
              <button
                type="button"
                className={`gd-quiz-tab ${quizTab === 'pasados' ? 'active' : ''}`}
                onClick={() => setQuizTab('pasados')}
              >
                Pasados
              </button>
            </article>

            {quizLoading ? (
              <p className="gd-empty">Cargando quizzes del grupo...</p>
            ) : quizError ? (
              <p className="gd-empty">{quizError}</p>
            ) : (quizTab === 'proximos' ? quizzesProximos : quizzesPasados).length === 0 ? (
              <p className="gd-empty">
                {quizTab === 'proximos' ? 'No hay quizzes próximos para este grupo.' : 'No hay quizzes pasados para este grupo.'}
              </p>
            ) : (
              <article className="gd-quiz-list">
                {(quizTab === 'proximos' ? quizzesProximos : quizzesPasados).map((quiz) => (
                  <QuizCatalogCard
                    key={quiz.id}
                    quiz={quiz}
                    expanded={expandedQuizId === quiz.id}
                    onToggleExpand={(quizId) => setExpandedQuizId((current) => current === quizId ? null : quizId)}
                    onEdit={(quizId) => navigate(`/grupos/${code}/quizzes/${quizId}/editar`)}
                    onDelete={handleBorrarQuiz}
                    PuedeManejar={PuedeManejar}
                  />
                ))}
              </article>
            )}
          </section>

          <section className="gd-card">
            <article className="gd-card-header">
              <span className="gd-card-title"><i className="bi bi-people"></i> Lista de Alumnos ({alumnos.length})</span>
              <button className="gd-btn" onClick={() => setModalAgregarAlumnos(true)}>
                <i className="bi bi-plus-lg"></i> Agregar
              </button>
            </article>

            {alumnos.map((a) =>
              a.estado === 'pendiente' ? (
                <article key={a.id} className="gd-student gd-student-pending">
                  <span>{a.nombre} <em>(Solicitud)</em></span>
                  <article className="gd-student-actions">
                    <button className="gd-icon-btn approve" onClick={() => handleAprove(a.id)} title="Aprobar">
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button className="gd-icon-btn reject" onClick={() => handleReject(a.id)} title="Rechazar">
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </article>
                </article>
              ) : (
                <article key={a.id} className="gd-student">
                  <span>{a.nombre}</span>
                </article>
              )
            )}
            {alumnos.length === 0 && <p className="gd-empty">Sin alumnos inscritos.</p>}
          </section>
        </article>
      )}
    </>
  );
}