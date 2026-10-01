import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function GrupoDetalleAlumno({ code }: { code: string }) {
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
