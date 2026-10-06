import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import GrupoDetalleAlumno from '../components/grupos/GrupoDetalleAlumno.tsx';
import GrupoDetalleDocente from '../components/grupos/GrupoDetalleDocente.tsx';
import '../styles/DetalleGrupo.css';

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
        {isStudent ? <GrupoDetalleAlumno code={code} /> : <GrupoDetalleDocente code={code} />}
      </main>
    </article>
  );
}