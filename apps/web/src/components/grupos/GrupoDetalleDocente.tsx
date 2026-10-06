import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalAgregarAlumnos from '../ModalAlumnos.tsx';
import QuizCatalogCard, { getQuizCatalogState } from '../quizzes/QuizCatalogCard.tsx';
import { apiClient } from '../../services/ApiClient';
import { fetchPersonas } from '../../services/personaService';

export interface GrupoDetalleBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  docenteId: string;
  plantelId: number | null;
  alumnosIds?: string[];
}

interface AlumnoEntry {
  id: string;
  nombre: string;
  estado: 'pendiente' | 'normal';
  calificacion?: number;
}

interface QuizCatalogBackend {
  id: string;
  nombre: string;
  fechaCreacion?: string | null;
  fechaInicio?: string | null;
  fechaFinalizacion?: string | null;
  grupoId?: string | null;
}

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
  const navigate = useNavigate();

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

        setGrupo(nextGrupo);
        setDocenteNombre(docente ? `${docente.nombre} ${docente.apellido}`.trim() : nextGrupo.docenteId);
        setAlumnos(
          alumnoList.map((persona) => ({
            id: persona.id,
            nombre: `${persona.nombre} ${persona.apellido}`.trim(),
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
    if (!window.confirm(`¿Borrar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
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

  function handleSendInvitations(correos: string[]) {
    const nuevos = correos.map((correo, i) => ({
      id: `invitado-${Date.now()}-${i}`,
      nombre: correo,
      estado: 'pendiente' as const,
    }));
    setAlumnos((prev) => [...nuevos, ...prev]);
  }

  if (loading) return <p className="gd-empty">Cargando grupo...</p>;
  if (!grupo) return <p className="gd-empty">Grupo no encontrado.</p>;

  return (
    <>
      {modalAgregarAlumnos && (
        <ModalAgregarAlumnos
          onClose={() => setModalAgregarAlumnos(false)}
          onEnviar={(correos) => {
            handleSendInvitations(correos);
            setModalAgregarAlumnos(false);
          }}
        />
      )}

      <section className="gd-hero">
        <span className="gd-hero-id">ID: {grupo.id}</span>
        <article className="gd-hero-row">
          <h1 className="gd-hero-title">{grupo.nombre}</h1>
          <span className="gd-hero-cycle">Ciclo: {grupo.semestre}</span>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">
          <span className="gd-meta-item"><strong className="gd-meta-label">Grado:</strong> {grupo.nombre}</span>
          <span className="gd-meta-item"><strong className="gd-meta-label">Docente:</strong> {docenteNombre}</span>
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
              <button className="gd-btn gd-btn-primary" onClick={() => navigate(`/grupos/${code}/quizzes/nuevo`)}>
                <i className="bi bi-plus-lg"></i> Nuevo Quiz
              </button>
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
