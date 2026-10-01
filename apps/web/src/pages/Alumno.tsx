import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient';
import '../styles/Alumno.css';
import { useSidebar } from '../context/SidebarContext.tsx';
import MisQuizCard from '../components/alumno/MisQuizCard.tsx';
import type { QuizAlumno, QuizAlumnoBackend } from '../types/AlumnoTypes.ts';

const MIN = 60_000;

const NOMBRE_ALUMNO = 'Carlos';

function parseTimestamp(value?: string | number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function normalizeQuiz(item: QuizAlumnoBackend, index: number): QuizAlumno {
  const grupoCode = String(item.grupoCode ?? item.claveGrupo ?? item.grupoId ?? item.grupo ?? `grupo-${index + 1}`);
  const titulo = item.titulo ?? item.nombre ?? `Quiz ${index + 1}`;
  const grupoNombre = item.grupoNombre ?? item.grupo ?? item.claveGrupo ?? grupoCode;
  const preguntas = Number(item.preguntas ?? item.totalPreguntas ?? 0);
  const segundosPorPregunta = Number(item.segundosPorPregunta ?? item.duracionSegundos ?? 0);
  const abre = parseTimestamp(item.abre ?? item.inicio ?? item.fechaInicio);
  const cierra = parseTimestamp(item.cierra ?? item.fin ?? item.fechaFinalizacion);

  return {
    id: String(item.id ?? `${grupoCode}-${index + 1}`),
    titulo,
    grupoCode,
    grupoNombre,
    preguntas,
    segundosPorPregunta,
    abre,
    cierra,
  };
}

function textoSaludo(activos: number): string {
  if (activos === 0) return 'No tienes quizzes activos por ahora.';
  if (activos === 1) return 'Tienes 1 quiz activo esperando.';
  return `Tienes ${activos} quizzes activos esperando.`;
}

export default function AlumnoInicio() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const [ahora, setAhora] = useState(() => Date.now());
  const [quizzes, setQuizzes] = useState<QuizAlumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), MIN);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMisQuizzes() {
      setLoading(true);
      try {
        const response = await apiClient.get<QuizAlumnoBackend[]>('/api/quizzes/mis-quizzes');
        const rawQuizzes = Array.isArray(response.data) ? response.data : [];
        if (!isMounted) return;

        setQuizzes(rawQuizzes.map((item, index) => normalizeQuiz(item, index)));
        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;

        setQuizzes([]);
        setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar tus quizzes.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadMisQuizzes();

    return () => {
      isMounted = false;
    };
  }, []);

  const vigentes = quizzes.filter((q) => q.cierra > ahora).map((q) => ({
    ...q,
    activo: q.abre <= ahora,
  }));

  const activos = vigentes.filter((q) => q.activo).sort((a, b) => a.cierra - b.cierra);
  const proximos = vigentes.filter((q) => !q.activo).sort((a, b) => a.abre - b.abre);
  const ordenados = useMemo(() => [...activos, ...proximos], [activos, proximos]);

  return (
    <article className="al-screen">
      <header className="al-topbar">
        <article className="al-topbar-side">
          <button className="al-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list al-icon"></i>
          </button>
          <span className="al-topbar-title">Alumno</span>
        </article>

      </header>

      <main className="al-content">
        <section className="al-intro">
          <h1 className="al-title">Inicio</h1>
          <p className="al-greeting">
            Hola, {NOMBRE_ALUMNO}. {textoSaludo(activos.length)}
          </p>
          <article className="al-counters">
            <span className="al-counter">Activos <strong>{activos.length}</strong></span>
            <span className="al-counter">Próximos <strong>{proximos.length}</strong></span>
          </article>
        </section>

        <h2 className="al-section-label">TUS QUIZZES MÁS CERCANOS</h2>

        {loading && <p className="al-empty">Cargando tus quizzes...</p>}
        {!loading && error && <p className="al-empty">{error}</p>}
        {!loading && !error && ordenados.length === 0 && <p className="al-empty">No tienes quizzes pendientes.</p>}

        <article className="al-list">
          {ordenados.map((q) => (
            <MisQuizCard
              key={`${q.grupoCode}-${q.id}`}
              id={q.id}
              titulo={q.titulo}
              grupoCode={q.grupoCode}
              grupoNombre={q.grupoNombre}
              preguntas={q.preguntas}
              segundosPorPregunta={q.segundosPorPregunta}
              abre={q.abre}
              cierra={q.cierra}
              activo={q.activo}
              ahora={ahora}
              onOpenGroup={(grupoCode) => navigate(`/grupos/${grupoCode}`)}
              onStartQuiz={(grupoCode, quizId) => navigate(`/grupos/${grupoCode}/quizzes/${quizId}/resolver`)}
            />
          ))}
        </article>
      </main>
    </article>
  );
}