import { useNavigate } from 'react-router-dom';
import AlumnoNav from '../components/AlumnosNav.tsx';
import '../styles/MisGrupos.css';

interface GrupoAlumno {
  code: string;
  materia: string;
  grupo: string;
  docente: string;
  activos: number;
  proximos: number;
  pasados: number;
}

// TODO: reemplazar por los grupos reales del alumno
const MOCK_MIS_GRUPOS: GrupoAlumno[] = [
  { code: 'MAT3-A', materia: 'Matemáticas III', grupo: '3.° A', docente: 'Prof. García', activos: 1, proximos: 1, pasados: 3 },
  { code: 'FIS2-B', materia: 'Física II', grupo: '2.° B', docente: 'Prof. Ruiz', activos: 1, proximos: 1, pasados: 1 },
  { code: 'PROG1-A', materia: 'Programación I', grupo: '1.° A', docente: 'Profa. Méndez', activos: 0, proximos: 1, pasados: 1 },
];

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export default function MisGrupos() {
  const navigate = useNavigate();

  return (
    <div className="mg-screen">
      <header className="mg-topbar">
        <div className="mg-topbar-side">
          <i className="bi bi-list mg-icon"></i>
          <span className="mg-topbar-title">Alumno</span>
        </div>
        <div className="mg-topbar-side">
          <i className="bi bi-bell mg-icon"></i>
          <i className="bi bi-person-circle mg-icon"></i>
        </div>
      </header>
      <AlumnoNav />

      <main className="mg-content">
        <section className="mg-intro">
          <h1 className="mg-title">Mis grupos</h1>
          <p className="mg-subtitle">Los grupos de los que formas parte este ciclo.</p>
        </section>

        {MOCK_MIS_GRUPOS.length === 0 && <p className="mg-empty">Todavía no perteneces a ningún grupo.</p>}

        <div className="mg-grid">
          {MOCK_MIS_GRUPOS.map((g) => (
            <button key={g.code} className="mg-card" onClick={() => navigate(`/grupos/${g.code}`)}>
              <h2 className="mg-card-title">{g.materia}</h2>
              <p className="mg-card-meta">{g.grupo} · {g.docente}</p>
              <div className="mg-pills">
                {g.activos > 0 && (
                  <span className="mg-pill mg-pill-activo">
                    <i className="bi bi-circle-fill"></i> {plural(g.activos, 'activo', 'activos')}
                  </span>
                )}
                {g.proximos > 0 && (
                  <span className="mg-pill mg-pill-proximo">{plural(g.proximos, 'próximo', 'próximos')}</span>
                )}
                {g.pasados > 0 && (
                  <span className="mg-pill mg-pill-pasado">{plural(g.pasados, 'pasado', 'pasados')}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}