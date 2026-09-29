import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import ModalAgregarAlumnos from '../components/ModalAlumnos.tsx';
import { apiClient } from '../services/ApiClient';
import { fetchPersonas } from '../services/personaService';
import "../styles/DetalleGrupo.css";

interface GrupoDetalleBackend {
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

interface QuizItemDocente {
  id: string;
  titulo: string;
  meta: string;
  etiquetaDerecha: string;
}

function VistaAlumno({ code }: { code: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<GrupoDetalleBackend | null>(null);
  const [docenteNombre, setDocenteNombre] = useState('—');
  const [alumnos, setAlumnos] = useState<AlumnoEntry[]>([]);

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

    void load();
    return () => { cancelled = true; };
  }, [code]);

  if (loading) return <p className="gd-empty">Cargando grupo...</p>;
  if (!grupo) return <p className="gd-empty">Grupo no encontrado.</p>;

  return (
    <>
      <section className="gd-hero">
        <span className="gd-hero-id">ID: {grupo.id}</span>
        <article className="gd-hero-row">
          <h1 className="gd-hero-title">{grupo.nombre}</h1>
          <span className="gd-hero-cycle">Ciclo: {grupo.semestre}</span>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">
          <span className="gd-meta-item"><strong className="gd-meta-label">Docente:</strong> {docenteNombre}</span>
          <span className="gd-meta-item"><strong className="gd-meta-label">Clave:</strong> {grupo.claveGrupo}</span>
          <span className="gd-meta-item"><strong className="gd-meta-label">Semestre:</strong> {grupo.semestre}</span>
        </article>
      </section>

      <section className="gd-card">
        <article className="gd-card-header">
          <span className="gd-card-title"><i className="bi bi-people"></i> Mi grupo</span>
        </article>

        <div className="gd-student-list">
          {alumnos.length === 0 ? (
            <p className="gd-empty">Aún no hay alumnos asociados a este grupo.</p>
          ) : (
            alumnos.map((alumno) => (
              <article key={alumno.id} className="gd-student">
                <span>{alumno.nombre}</span>
              </article>
            ))
          )}
        </div>

        <div className="gd-quiz-actions">
          <button className="gd-btn gd-btn-primary" onClick={() => navigate(`/grupos/${code}/quizzes/nuevo`)}>
            <i className="bi bi-journal-plus"></i> Ir a quizzes
          </button>
        </div>
      </section>
    </>
  );
}

function VistaDocente({ code }: { code: string }) {
  const [tab, setTab] = useState<'general' | 'settings'>('general');
  const [copiado, setCopiado] = useState(false);
  const [modalAgregarAlumnos, setModalAgregarAlumnos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<GrupoDetalleBackend | null>(null);
  const [docenteNombre, setDocenteNombre] = useState('—');
  const [alumnos, setAlumnos] = useState<AlumnoEntry[]>([]);
  const [quizzesProximos, setQuizzesProximos] = useState<QuizItemDocente[]>([]);
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

    void load();
    return () => { cancelled = true; };
  }, [code]);

  function handleBorrarQuiz(id: string, titulo: string) {
    if (!window.confirm(`¿Borrar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    setQuizzesProximos((prev) => prev.filter((q) => q.id !== id));
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
          onEnviar={handleSendInvitations}
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

            <p className="gd-section-label">PRÓXIMOS</p>
            {quizzesProximos.length === 0 && <p className="gd-empty">No hay quizzes próximos para este grupo.</p>}
            {quizzesProximos.map((q) => (
              <article key={q.id} className="gd-quiz gd-quiz-stack">
                <article className="gd-quiz-row">
                  <article className="gd-quiz-info">
                    <span className="gd-quiz-title">{q.titulo}</span>
                    <span className="gd-quiz-meta">{q.meta}</span>
                  </article>
                  <span className="gd-badge gd-badge-fecha">{q.etiquetaDerecha}</span>
                </article>
                <article className="gd-quiz-actions">
                  <button className="gd-btn" onClick={() => navigate(`/grupos/${code}/quizzes/${q.id}/editar`)}>
                    <i className="bi bi-pencil"></i> Editar
                  </button>
                  <button className="gd-btn gd-btn-danger" onClick={() => handleBorrarQuiz(q.id, q.titulo)}>
                    <i className="bi bi-trash"></i> Borrar
                  </button>
                </article>
              </article>
            ))}
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

export default function GroupDetail() {
  const { role } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { code } = useParams<{ code: string }>();
  const isStudent = role === 'alumno';

  if (!code) {
    return <p className="gd-empty">Código de grupo no especificado.</p>;
  }

  return (
    <article className="gd-screen">
      <header className="gd-topbar">
        <article className="gd-topbar-side">
          <button className="gd-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list gd-icon"></i>
          </button>
          <span className="gd-topbar-title">{isStudent ? 'Alumno' : 'Docente'}</span>
        </article>
      </header>

      <main className="gd-content">
        {isStudent ? <VistaAlumno code={code} /> : <VistaDocente code={code} />}
      </main>
    </article>
  );
}