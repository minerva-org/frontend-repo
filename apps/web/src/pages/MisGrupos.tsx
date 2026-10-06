import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient.ts';
import { useSidebar } from '../context/SidebarContext.tsx';
import '../styles/MisGrupos.css';
import { useAuth } from '../context/AuthContext.tsx';

interface GrupoBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  activo?: boolean;
  alumnosIds?: string[];
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export default function MisGrupos() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const [grupos, setGrupos] = useState<GrupoBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const personaId = user?.personaId;

  useEffect(() => {
    async function cargarGrupos() {
      setLoading(true);

      if (!personaId) {
        setError('No se encontró el ID de persona. Cierra sesión y vuelve a ingresar.');
        setLoading(false);
        return;
      }

      try {
        const gruposResponse = await apiClient.get<GrupoBackend[]>('/api/grupos');
        const grupos = gruposResponse.data ?? [];

        const resultados = await Promise.all(
          grupos.map(async (grupo) => {
            const response = await apiClient.get<unknown[]>(
              `/api/grupos/${grupo.id}/alumnos`,
            );


            const alumnosIds = (response.data ?? []).map((alumno) => {
              if (typeof alumno === 'string') return alumno;

              if (alumno && typeof alumno === 'object') {
                const registro = alumno as {
                  id?: string;
                  personaId?: string;
                  idAlumno?: string;
                };
                return registro.personaId ?? registro.idAlumno ?? registro.id ?? '';
              }

              return '';
            });

            const coincide = alumnosIds.some(
              (id) => id.trim().toLowerCase() === personaId.trim().toLowerCase(),
            );


            return coincide ? { ...grupo, alumnosIds } : null;
          }),
        );

        setGrupos(resultados.filter((grupo): grupo is GrupoBackend => grupo !== null));
        setError(null);
      } catch (err) {
        console.error('Error cargando grupos del alumno:', err);
        setError('No se pudieron cargar tus grupos.');
      } finally {
        setLoading(false);
      }
    }

    void cargarGrupos();
  }, [personaId]);

  const gruposActivos = useMemo(
    () => grupos.filter((g) => g.activo !== false),
    [grupos],
  );

  return (
    <article className="mg-screen">
      <header className="mg-topbar">
        <article className="mg-topbar-side">
          <button className="mg-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list mg-icon"></i>
          </button>
          <span className="mg-topbar-title">Alumno</span>
        </article>
      </header>

      <main className="mg-content">
        <section className="mg-intro">
          <h1 className="mg-title">Mis grupos</h1>
          <p className="mg-subtitle">Los grupos de los que formas parte este ciclo.</p>
        </section>

        {loading ? (
          <p className="mg-empty">Cargando grupos...</p>
        ) : error ? (
          <p className="mg-empty">{error}</p>
        ) : gruposActivos.length === 0 ? (
          <p className="mg-empty">Todavía no perteneces a ningún grupo.</p>
        ) : null}

        <article className="mg-grid">
          {gruposActivos.map((g) => (
            <button
              key={g.id}
              className="mg-card"
              onClick={() => navigate(`/grupos/${g.id}`)}
            >
              <h2 className="mg-card-title">{g.nombre}</h2>
              <p className="mg-card-meta">{g.semestre} · {g.alumnosIds?.length || 0} alumnos</p>
              <article className="mg-pills">
                {g.activo && (
                  <span className="mg-pill mg-pill-activo">
                    <i className="bi bi-circle-fill"></i> Activo
                  </span>
                )}
              </article>
            </button>
          ))}
        </article>
      </main>
    </article>
  );
}