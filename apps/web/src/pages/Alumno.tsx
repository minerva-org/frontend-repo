import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient';
import '../styles/Alumno.css';
import { useSidebar } from '../context/SidebarContext.tsx';
import SidebarToggleIcon from '../components/common/SidebarToggleIcon.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { GrupoAlumnoBackend, QuizAlumnoBackend} from '../types/AlumnoTypes';
import MisQuizCard from '../components/alumno/MisQuizCard.tsx';
import '../styles/MisGrupos.css';

interface QuizAlumno {
  id: string;
  titulo: string;
  grupoCode: string;
  grupoNombre: string;
  abre: number;   
  cierra: number;
}

const MIN = 60_000;







function textoSaludo(activos: number): string {
  if (activos === 0) return 'No tienes quizzes activos por ahora.';
  if (activos === 1) return 'Tienes 1 quiz activo esperando.';
  return `Tienes ${activos} quizzes activos esperando.`;
}

export default function AlumnoInicio() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const nombreAlumno = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || user?.email || 'Alumno';
  const [ahora, setAhora] = useState(() => Date.now());
  const [quizzes, setQuizzes] = useState<QuizAlumno[]>([]);
  const [grupos, setGrupos] = useState<GrupoAlumnoBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [intentos, setIntentos] = useState<{ quizId: string; intentoId: string; finalizado: boolean }[]>([]);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), MIN);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
  async function cargarDatos() {
    try {

      const gruposResponse = await apiClient.get<GrupoAlumnoBackend[]>(
        '/api/grupos/mis-grupos'
      );

      const misGrupos = gruposResponse.data ?? [];
      setGrupos(misGrupos);

      const gruposIds = new Set(
        misGrupos.map((grupo) => String(grupo.id))
      );

      const quizzesResponse = await apiClient.get<QuizAlumnoBackend[]>(
        '/api/quizzes'
      );

      const intentosResponse = await apiClient.get<
        { quizId: string; intentoId: string; finalizado: boolean }[]
      >('/api/quizzes/mis-intentos');
      setIntentos(intentosResponse.data ?? []);

      const quizzesFiltrados = (quizzesResponse.data ?? []).filter(
        (quiz) =>
          quiz.grupoId != null &&
          gruposIds.has(String(quiz.grupoId))
      );

      const datos: QuizAlumno[] = quizzesFiltrados.map((quiz) => {
        const grupo = misGrupos.find(
          (g) => g.id === String(quiz.grupoId)
        );

        return {
          id: String(quiz.id ?? ''),
          titulo: quiz.nombre ?? quiz.titulo ?? 'Quiz sin título',
          grupoCode: String(grupo?.id ?? quiz.grupoId ?? ''),
          grupoNombre: grupo?.nombre ?? grupo?.claveGrupo ?? 'Grupo',
          abre: quiz.fechaInicio
            ? Date.parse(String(quiz.fechaInicio))
            : quiz.abre
              ? Number(quiz.abre)
              : Date.now(),
          cierra: quiz.fechaFinalizacion
            ? Date.parse(String(quiz.fechaFinalizacion))
            : quiz.cierra
              ? Number(quiz.cierra)
              : Date.now(),
        };
              });

      setQuizzes(datos);
    } catch (error) {
      console.error('Error al cargar los datos del alumno:', error);
      setError('No se pudieron cargar los grupos o quizzes.');
    } finally {
      setLoading(false);
    }
  }

  void cargarDatos();
}, []);

  const vigentes = quizzes.filter((q) => q.cierra > ahora).map((q) => ({
    ...q,
    activo: q.abre <= ahora,
  }));

  const activos = vigentes.filter((q) => 
    q.activo && !intentos.find((i) => i.quizId === q.id)?.finalizado).sort((a, b) => a.cierra - b.cierra);
  const proximos = vigentes.filter((q) => !q.activo).sort((a, b) => a.abre - b.abre);
   const ordenados = [ ...vigentes.filter((q) => q.activo).sort((a, b) => a.cierra - b.cierra), ...proximos, ];

   const gruposConConteos = useMemo(() => grupos
     .filter((grupo) => grupo.activo !== false)
     .map((grupo) => ({
       grupo,
       activos: quizzes.filter((quiz) =>
         quiz.grupoCode === grupo.id
         && quiz.abre <= ahora
         && quiz.cierra >= ahora).length,
       proximos: quizzes.filter((quiz) =>
         quiz.grupoCode === grupo.id
         && quiz.abre > ahora).length,
       pasados: quizzes.filter((quiz) =>
         quiz.grupoCode === grupo.id
         && quiz.cierra < ahora).length,
     })), [ahora, grupos, quizzes]);

  return (
    <article className="al-screen">
      <header className="al-topbar">
        <article className="al-topbar-side">
          <button className="al-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <SidebarToggleIcon className="al-icon" />
          </button>
          <span className="al-topbar-title">Alumno</span>
        </article>

      </header>

      <main className="al-content">
        <section className="al-intro">
          <h1 className="al-title">Inicio</h1>
          <p className="al-greeting">
            Hola, {nombreAlumno}. {textoSaludo(activos.length)}
          </p>
          <article className="al-counters">
            <span className="al-counter">Activos <strong>{activos.length}</strong></span>
            <span className="al-counter">Próximos <strong>{proximos.length}</strong></span>
          </article>
        </section>

        {!loading && !error && (
          <section className="mb-3">
            <article className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <h2 className="h5 fw-bold mb-0">Mis grupos</h2>
              <span className="text-secondary small">
                {gruposConConteos.length} {gruposConConteos.length === 1 ? 'grupo' : 'grupos'}
              </span>
            </article>
            {gruposConConteos.length === 0 ? (
              <p className="al-empty">Todavía no perteneces a ningún grupo.</p>
            ) : (
              <article className="mg-grid">
                {gruposConConteos.map(({ grupo, activos: activosGrupo, proximos: proximosGrupo, pasados }) => (
                  <button
                    type="button"
                    key={grupo.id}
                    className="mg-card"
                    onClick={() => navigate(`/grupos/${grupo.id}`)}
                  >
                    <h2 className="mg-card-title">{grupo.nombre}</h2>
                    <p className="mg-card-meta">
                      {grupo.semestre} · {grupo.alumnosIds?.length || 0} alumnos
                    </p>
                    <article className="mg-pills">
                      <span className="mg-pill mg-pill-activo">
                        <i className="bi bi-circle-fill" /> Grupo activo
                      </span>
                    </article>
                    <article className="mg-pills">
                      <span className="mg-pill">
                        <i className="bi bi-play-circle" /> Activas: {activosGrupo}
                      </span>
                      <span className="mg-pill">
                        <i className="bi bi-clock" /> Próximas: {proximosGrupo}
                      </span>
                      <span className="mg-pill">
                        <i className="bi bi-check-circle" /> Pasadas: {pasados}
                      </span>
                    </article>
                  </button>
                ))}
              </article>
            )}
          </section>
        )}

        {loading && <p className="al-empty">Cargando quizzes...</p>}
        {error && <p className="al-empty">{error}</p>}

        {!loading && !error && (
          <article className="al-list">
                        {ordenados.map((q) => (
              <MisQuizCard
                key={`${q.grupoCode}-${q.id}`}
                id={q.id}
                titulo={q.titulo}
                grupoCode={q.grupoCode}
                grupoNombre={q.grupoNombre}
                abre={q.abre}
                cierra={q.cierra}
                activo={q.activo}
                ahora={ahora}
                intento={intentos.find((i) => i.quizId === q.id)}
                onOpenGroup={(code) => navigate(`/grupos/${code}`)}
                onStartQuiz={(code, quizId) =>
                  navigate(`/grupos/${code}/quizzes/${quizId}/resolver`)
                }
              />
            ))}
          </article>
        )}
      </main>
    </article>
  );
}