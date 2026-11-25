import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import SidebarToggleIcon from '../components/common/SidebarToggleIcon.tsx';
import GrupoDetalleAlumno from '../components/grupos/GrupoDetalleAlumno.tsx';
import GrupoDetalleDocente from '../components/grupos/GrupoDetalleDocente.tsx';

export default function GroupDetail() {
  const { role } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { code } = useParams<{ code: string }>();
  const isStudent = role === 'alumno';

  if (!code) {
    return <p className="text-center text-secondary p-3 mb-0">Código de grupo no especificado.</p>;
  }

  return (
    <article className="min-vh-100 bg-body text-body">
      <header className="sticky-top d-flex align-items-center px-3 px-md-4 py-3 bg-primary bg-gradient text-light shadow-sm">
        <article className="d-flex align-items-center gap-3">
          <button className="btn btn-link text-light p-0 text-decoration-none" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <SidebarToggleIcon className="fs-4" />
          </button>
          <span className="fs-5 fw-bold">
            {isStudent ? 'Alumno' : 'Grupos'}
          </span>
        </article>
      </header>

      <main className="container-xl d-flex flex-column gap-3 px-3 px-md-4 py-3 py-md-4">
        {isStudent ? <GrupoDetalleAlumno code={code} /> : <GrupoDetalleDocente code={code} />}
      </main>
    </article>
  );
}