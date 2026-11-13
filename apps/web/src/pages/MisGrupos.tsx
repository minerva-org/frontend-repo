
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient.ts';
import { useSidebar } from '../context/SidebarContext.tsx';
import '../styles/MisGrupos.css';

interface GrupoBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  activo: boolean;
  docenteId: string | null;
  plantelId: number | null;
  alumnosIds: string[];
}

interface QuizBackend {
  id: string | number;
  nombre: string;
  grupoId: string | number | null;
  fechaInicio: string | number | null;
  fechaFinalizacion: string | number | null;
}

interface ConteoQuizzes {
  activos: number;
  proximos: number;
  pasados: number;
}

function convertirFecha(fecha: string | number | null | undefined): number | null {
  if (fecha === null || fecha === undefined) return null;

  const timestamp =
    typeof fecha === 'number' ? fecha : Date.parse(fecha);

  return Number.isNaN(timestamp) ? null : timestamp;
}

export default function MisGrupos() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  const [grupos, setGrupos] = useState<GrupoBackend[]>([]);
  const [quizzes, setQuizzes] = useState<QuizBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzesError, setQuizzesError] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAhora(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        const [gruposResult, quizzesResult] = await Promise.allSettled([
          apiClient.get<GrupoBackend[]>('/api/grupos/mis-grupos'),
          apiClient.get<QuizBackend[]>('/api/quizzes'),
        ]);

        if (gruposResult.status === 'rejected') {
          throw gruposResult.reason;
        }

        setGrupos(gruposResult.value.data ?? []);

        if (quizzesResult.status === 'fulfilled') {
          setQuizzes(quizzesResult.value.data ?? []);
          setQuizzesError(false);
        } else {
          console.error('Error cargando evaluaciones:', quizzesResult.reason);
          setQuizzesError(true);
        }
      } catch (err) {
        console.error('Error cargando grupos del alumno:', err);
        setError('No se pudieron cargar tus grupos.');
      } finally {
        setLoading(false);
      }
    }

    void cargarDatos();
  }, []);

  const gruposActivos = useMemo(
    () => grupos.filter((g) => g.activo !== false),
    [grupos],
  );

  const conteosPorGrupo = useMemo(() => {
    const conteos: Record<string, ConteoQuizzes> = {};

    gruposActivos.forEach((grupo) => {
      conteos[grupo.id] = {
        activos: 0,
        proximos: 0,
        pasados: 0,
      };
    });

    quizzes.forEach((quiz) => {
      const grupoId = String(quiz.grupoId ?? '');

      if (!conteos[grupoId]) return;

      const inicio = convertirFecha(quiz.fechaInicio);
      const fin = convertirFecha(quiz.fechaFinalizacion);

      if (inicio === null || fin === null) return;

      if (ahora < inicio) {
        conteos[grupoId].proximos++;
      } else if (ahora <= fin) {
        conteos[grupoId].activos++;
      } else {
        conteos[grupoId].pasados++;
      }
    });

    return conteos;
  }, [gruposActivos, quizzes, ahora]);

  return (
    <article className="mg-screen">
      <header className="mg-topbar">
        <article className="mg-topbar-side">
          <button
            className="mg-icon-btn-plain"
            onClick={toggleSidebar}
            title="Mostrar u ocultar menú"
            aria-label="Mostrar u ocultar menú"
          >
            <i className="bi bi-list mg-icon"></i>
          </button>
          <span className="mg-topbar-title">Alumno</span>
        </article>
      </header>

      <main className="mg-content">
        <section className="mg-intro">
          <h1 className="mg-title">Mis grupos</h1>
          <p className="mg-subtitle">
            Los grupos de los que formas parte este ciclo.
          </p>
        </section>

        {loading ? (
          <p className="mg-empty">Cargando grupos...</p>
        ) : error ? (
          <p className="mg-empty">{error}</p>
        ) : gruposActivos.length === 0 ? (
          <p className="mg-empty">
            Todavía no perteneces a ningún grupo.
          </p>
        ) : null}

        {quizzesError && !loading && (
          <p className="mg-empty">
            No fue posible cargar las evaluaciones de tus grupos.
          </p>
        )}

        <article className="mg-grid">
          {gruposActivos.map((g) => {
            const conteo = conteosPorGrupo[g.id] ?? {
              activos: 0,
              proximos: 0,
              pasados: 0,
            };

            return (
              <button
                key={g.id}
                className="mg-card"
                onClick={() => navigate(`/grupos/${g.id}`)}
              >
                <h2 className="mg-card-title">{g.nombre}</h2>

                <p className="mg-card-meta">
                  {g.semestre} · {g.alumnosIds?.length || 0} alumnos
                </p>

                <article className="mg-pills">
                  <span className="mg-pill mg-pill-activo">
                    <i className="bi bi-circle-fill"></i> Grupo activo
                  </span>
                </article>

                <article className="mg-pills">
                  <span className="mg-pill">
                    <i className="bi bi-play-circle"></i>
                    Activas: {conteo.activos}
                  </span>

                  <span className="mg-pill">
                    <i className="bi bi-clock"></i>
                    Próximas: {conteo.proximos}
                  </span>

                  <span className="mg-pill">
                    <i className="bi bi-check-circle"></i>
                    Pasadas: {conteo.pasados}
                  </span>
                </article>
              </button>
            );
          })}
        </article>
      </main>
    </article>
  );
}
