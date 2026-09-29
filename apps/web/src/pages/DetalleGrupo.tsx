import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import ModalAgregarAlumnos from '../components/ModalAlumnos.tsx';
import "../styles/DetalleGrupo.css";

interface QuizItemAlumno {
  id: string;
  titulo: string;
  preguntas: number;
  estado: 'disponible' | 'no_disponible';
  meta: string;
}

interface DetalleAlumnoData {
  idVisible: string;
  titulo: string;
  materia: string;
  grado: string;
  docente: string;
  ciclo: string;
  proximos: QuizItemAlumno[];
  pasados: QuizItemAlumno[];
}

const MOCK_DETALLE_ALUMNO: Record<string, DetalleAlumnoData> = {
  'MAT3-A': {
    idVisible: 'GRP-2026-MAT3A',
    titulo: 'Matemáticas III — 3.° A',
    materia: 'Matemáticas',
    grado: '3.° Bachillerato',
    docente: 'Prof. García',
    ciclo: 'Ago 2026 – Ene 2027',
    proximos: [
      { id: 'q4', titulo: 'Quiz 4: Identidades Trigonométricas', preguntas: 5, estado: 'disponible', meta: 'Disponible ahora · Cierra 14 Sep 2026, 11:59 PM' },
    ],
    pasados: [
      { id: 'q3', titulo: 'Quiz 3: Teorema de Pitágoras', preguntas: 5, estado: 'no_disponible', meta: '34 / 36 respondieron' },
    ],
  },
};

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

interface DetalleDocenteData {
  idVisible: string;
  titulo: string;
  grado: string;
  materia: string;
  codigoInscripcion: string;
  ciclo: string;
  quizzesProximos: QuizItemDocente[];
  quizzesPasados: QuizItemDocente[];
  alumnos: AlumnoEntry[];
}

const MOCK_DETALLE_DOCENTE: Record<string, DetalleDocenteData> = {
  'MAT3-A': {
    idVisible: 'GRP-2026-MAT3A',
    titulo: 'Matemáticas III — 3.° A',
    grado: '3.° Bachillerato',
    materia: 'Matemáticas',
    codigoInscripcion: 'MAT3A-26B',
    ciclo: 'Ago 2026 – Ene 2027',
    quizzesProximos: [
      { id: 'q4', titulo: 'Quiz 4: Identidades Trigonométricas', meta: '5 Preguntas · Conceptos: Seno recíproco, Identidad fundamental', etiquetaDerecha: '14 Sep 2026' },
    ],
    quizzesPasados: [
      { id: 'q3', titulo: 'Quiz 3: Teorema de Pitágoras', meta: '', etiquetaDerecha: '34 / 36 Respondieron' },
    ],
    alumnos: [
      { id: 's0', nombre: 'Mariana López', estado: 'pendiente' },
      { id: 's1', nombre: 'Alejandro Vega', estado: 'normal', calificacion: 94 },
      { id: 's2', nombre: 'Carlos Méndez', estado: 'normal', calificacion: 52 },
      { id: 's3', nombre: 'Sofía Valenzuela', estado: 'normal', calificacion: 68 },
    ],
  },
};

function claseCalificacion(cal: number): string {
  if (cal >= 80) return 'puntuacionAlta';
  if (cal >= 60) return 'puntuacionMedia';
  return 'puntuacionBaja';
}


function VistaAlumno({ code }: { code: string }) {
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos');
  const data = MOCK_DETALLE_ALUMNO[code];
  const navigate = useNavigate();

  if (!data) return <p className="gd-empty">Grupo no encontrado.</p>;

  const quizzes = tab === 'proximos' ? data.proximos : data.pasados;

  return (
    <>
      <section className="gd-hero">
        <span className="gd-hero-id">ID: {data.idVisible}</span>
        <article className="gd-hero-row">
          <h1 className="gd-hero-title">{data.titulo}</h1>
          <span className="gd-hero-cycle">Ciclo: {data.ciclo}</span>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">
          <span className="gd-meta-item"><strong className="gd-meta-label">Docente:</strong> {data.docente}</span>
          <span className="gd-meta-item"><strong className="gd-meta-label">Materia:</strong> {data.materia}</span>
          <span className="gd-meta-item"><strong className="gd-meta-label">Grado:</strong> {data.grado}</span>
        </article>
      </section>

      <section className="gd-card">
        <article className="gd-card-header">
          <span className="gd-card-title"><i className="bi bi-journal-text"></i> Mis Quizzes</span>
          <article className="gd-tabs">
            <button className={`gd-tab ${tab === 'proximos' ? 'active' : ''}`} onClick={() => setTab('proximos')}>
              Próximos
            </button>
            <button className={`gd-tab ${tab === 'pasados' ? 'active' : ''}`} onClick={() => setTab('pasados')}>
              Pasados
            </button>
          </article>
        </article>

        {quizzes.length === 0 && <p className="gd-empty">No hay quizzes en esta sección.</p>}

        {quizzes.map((quiz) => (
          <article key={quiz.id} className={`gd-quiz ${tab === 'pasados' ? 'gd-quiz-past' : ''}`}>
            <article className="gd-quiz-info">
              <span className="gd-quiz-title">{quiz.titulo}</span>
              <span className="gd-quiz-meta">{quiz.preguntas} preguntas · {quiz.meta}</span>
            </article>
            <article className="gd-quiz-side">
              <span className={quiz.estado}>
                {quiz.estado === 'disponible' ? 'Disponible' : 'Cerrado'}
              </span>
              <button
                className="gd-btn gd-btn-primary"
                disabled={quiz.estado !== 'disponible'}
                onClick={() => navigate(`/grupos/${code}/quizzes/${quiz.id}/resolver`)}
              >
                Contestar
              </button>
            </article>
          </article>
        ))}
      </section>
    </>
  );
}

function VistaDocente({ code }: { code: string }) {
  const [tab, setTab] = useState<'general' | 'settings'>('general');
  const [copiado, setCopiado] = useState(false);
  const [modalAgregarAlumnos, setModalAgregarAlumnos] = useState(false);
  const inicial = MOCK_DETALLE_DOCENTE[code];
  const [alumnos, setAlumnos] = useState<AlumnoEntry[]>(inicial?.alumnos ?? []);
  const [quizzesProximos, setQuizzesProximos] = useState<QuizItemDocente[]>(inicial?.quizzesProximos ?? []);
  const navigate = useNavigate();

  if (!inicial) return <p className="gd-empty">Grupo no encontrado.</p>;

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
    navigator.clipboard?.writeText(inicial.codigoInscripcion).catch(() => {});
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

  return (
    <>
      {modalAgregarAlumnos && (
        <ModalAgregarAlumnos
          onClose={() => setModalAgregarAlumnos(false)}
          onEnviar={handleSendInvitations}
        />
      )}

      <section className="gd-hero">
        <span className="gd-hero-id">ID: {inicial.idVisible}</span>
        <article className="gd-hero-row">
          <h1 className="gd-hero-title">{inicial.titulo}</h1>
          <span className="gd-hero-cycle">Ciclo: {inicial.ciclo}</span>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">
          <span className="gd-meta-item"><strong className="gd-meta-label">Grado:</strong> {inicial.grado}</span>
          <span className="gd-meta-item"><strong className="gd-meta-label">Materia:</strong> {inicial.materia}</span>
          <span className="gd-meta-item">
            <strong className="gd-meta-label">Código:</strong>
            <span className="gd-code">
              {inicial.codigoInscripcion}
              <i
                className={`bi ${copiado ? 'bi-check-lg' : 'bi-clipboard'}`}
                onClick={handleCopiarCodigo}
                title="Copiar código"
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
            {quizzesProximos.length === 0 && <p className="gd-empty">No hay quizzes próximos.</p>}
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
                  <button
                    className="gd-btn"
                    onClick={() => navigate(`/grupos/${code}/quizzes/${q.id}/editar`)}
                  >
                    <i className="bi bi-pencil"></i> Editar
                  </button>
                  <button
                    className="gd-btn gd-btn-danger"
                    onClick={() => handleBorrarQuiz(q.id, q.titulo)}
                  >
                    <i className="bi bi-trash"></i> Borrar
                  </button>
                </article>
              </article>
            ))}

            <p className="gd-section-label">PASADOS</p>
            {inicial.quizzesPasados.map((q) => (
              <article key={q.id} className="gd-quiz gd-quiz-past">
                <article className="gd-quiz-info">
                  <span className="gd-quiz-title">{q.titulo}</span>
                </article>
                <span className="gd-badge gd-badge-ok">{q.etiquetaDerecha}</span>
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
                  {typeof a.calificacion === 'number' && (
                    <span className={claseCalificacion(a.calificacion)}>{a.calificacion}%</span>
                  )}
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