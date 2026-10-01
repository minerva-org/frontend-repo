import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient';
import { useSidebar } from '../context/SidebarContext.tsx';
import MisGrupoCard from '../components/alumno/MisGrupoCard.tsx';
import type { GrupoAlumno, GrupoAlumnoBackend } from '../types/AlumnoTypes.ts';
import '../styles/MisGrupos.css';

function normalizeGrupo(item: GrupoAlumnoBackend, index: number): GrupoAlumno {
  const id = String(item.id ?? item.code ?? item.claveGrupo ?? `grupo-${index + 1}`);
  const code = String(item.code ?? item.claveGrupo ?? id);
  const materia = item.materia ?? item.materiaNombre ?? item.nombre ?? code;
  const grupo = item.grupo ?? item.grado ?? item.claveGrupo ?? code;
  const docente = item.docente ?? item.docenteNombre ?? 'Docente no asignado';

  return {
    id,
    code,
    materia,
    grupo,
    docente,
    activos: Number(item.activos ?? 0),
    proximos: Number(item.proximos ?? 0),
    pasados: Number(item.pasados ?? 0),
  };
}

export default function MisGrupos() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const [groups, setGroups] = useState<GrupoAlumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMisGrupos() {
      setLoading(true);
      try {
        const response = await apiClient.get<GrupoAlumnoBackend[]>('/api/grupos/mis-grupos');
        const rawGroups = Array.isArray(response.data) ? response.data : [];
        if (!isMounted) return;

        setGroups(rawGroups.map((item, index) => normalizeGrupo(item, index)));
        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;

        setGroups([]);
        setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar tus grupos.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadMisGrupos();

    return () => {
      isMounted = false;
    };
  }, []);

  const orderedGroups = useMemo(() => {
    return [...groups].sort((left, right) => {
      if (right.activos !== left.activos) return right.activos - left.activos;
      if (right.proximos !== left.proximos) return right.proximos - left.proximos;
      return left.materia.localeCompare(right.materia);
    });
  }, [groups]);

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

        {loading && <p className="mg-empty">Cargando tus grupos...</p>}
        {!loading && error && <p className="mg-empty">{error}</p>}
        {!loading && !error && orderedGroups.length === 0 && <p className="mg-empty">Todavía no perteneces a ningún grupo.</p>}

        <article className="mg-grid">
          {orderedGroups.map((g) => (
            <MisGrupoCard
              key={g.id}
              id={g.id}
              materia={g.materia}
              grupo={g.grupo}
              docente={g.docente}
              activos={g.activos}
              proximos={g.proximos}
              pasados={g.pasados}
              onClick={(groupId) => navigate(`/grupos/${groupId}`)}
            />
          ))}
        </article>
      </main>
    </article>
  );
}