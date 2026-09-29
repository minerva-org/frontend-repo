import { useState } from 'react';
import { useSidebar } from '../context/SidebarContext.tsx';
import '../styles/CatalogoAlumnos.css';

type EstadoAlumno = 'activo' | 'inactivo';

interface Alumno {
  id: string;
  nombre: string;
  matricula: string;
  correo: string;
  estado: EstadoAlumno;
}

const MOCK_ALUMNOS: Alumno[] = [
  { id: '1', nombre: 'Carlos Díaz Ramírez', matricula: '2026-0142', correo: '2026-0142@alumnos.chapalagutierrez.edu.mx', estado: 'activo' },
  { id: '2', nombre: 'Ana Sofía Beltrán', matricula: '2026-0143', correo: '2026-0143@alumnos.chapalagutierrez.edu.mx', estado: 'activo' },
  { id: '3', nombre: 'Luis Fernando Ibarra', matricula: '2025-0871', correo: '2025-0871@alumnos.chapalagutierrez.edu.mx', estado: 'inactivo' },
];

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function correoDeMatricula(matricula: string): string {
  return `${matricula.trim()}@alumnos.chapalagutierrez.edu.mx`;
}

export default function CatalogoAlumnos() {
  const { toggleSidebar } = useSidebar();

  const [alumnos, setAlumnos] = useState<Alumno[]>(MOCK_ALUMNOS);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Alumno | null>(null);

  const filtrados = alumnos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.matricula.toLowerCase().includes(search.toLowerCase())
  );

  function handleToggleEstado(id: string) {
    setAlumnos((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, estado: a.estado === 'activo' ? 'inactivo' : 'activo' } : a
      )
    );
  }

  function handleCreate(nuevo: { nombre: string; matricula: string }) {
    const alumno: Alumno = {
      id: crypto.randomUUID(),
      nombre: nuevo.nombre,
      matricula: nuevo.matricula,
      correo: correoDeMatricula(nuevo.matricula),
      estado: 'activo',
    };
    setAlumnos((prev) => [alumno, ...prev]);
    setShowCreate(false);
  }

  function handleEditSave(id: string, cambios: { nombre: string; matricula: string }) {
    setAlumnos((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, nombre: cambios.nombre, matricula: cambios.matricula, correo: correoDeMatricula(cambios.matricula) }
          : a
      )
    );
    setEditing(null);
  }

  return (
    <article className="ca-screen">
      <header className="ca-topbar">
        <button
          className="ca-icon-btn"
          onClick={toggleSidebar}
          title="Mostrar u ocultar menú"
          aria-label="Mostrar u ocultar menú"
        >
          <i className="bi bi-list"></i>
        </button>
        <span className="ca-topbar-title">Alumnos</span>
      </header>

      <div className="ca-body">
        <header className="ca-header">
          <article>
            <h1 className="ca-title">Portal de Coordinación Escolar</h1>
            <p className="ca-subtitle">
              Apertura de grupos, matrícula de alumnos y docentes, y gestión del plan de estudios oficial.
            </p>
          </article>
        </header>

        <article className="ca-scope-row">
          <p className="ca-scope-text">
            <strong>Ámbito Operativo:</strong> Asignaturas y grupos bajo su titularidad académica.
          </p>
        </article>

        <article className="ca-toolbar">
          <article className="ca-search-row">
            <i className="bi bi-search ca-search-icon"></i>
            <input
              className="ca-search-input"
              type="text"
              placeholder="Buscar alumno por nombre o matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </article>
          <button className="ca-new-button" onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-lg"></i> Nuevo alumno
          </button>
        </article>

        <article className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Matrícula</th>
                <th>Estado</th>
                <th className="ca-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id} className={a.estado === 'inactivo' ? 'ca-row-inactivo' : ''}>
                  <td>
                    <span className="ca-nombre">{a.nombre}</span>
                    <span className="ca-correo">{a.correo}</span>
                  </td>
                  <td>
                    <span className="ca-matricula">{a.matricula}</span>
                  </td>
                  <td>
                    <span className={`ca-estado ${a.estado === 'activo' ? 'ca-estado-activo' : 'ca-estado-inactivo'}`}>
                      {a.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="ca-acciones">
                    <button className="ca-link-button" onClick={() => setEditing(a)}>
                      <i className="bi bi-pencil"></i> Editar
                    </button>
                    <button
                      className={`ca-link-button ${a.estado === 'activo' ? 'ca-link-danger' : 'ca-link-success'}`}
                      onClick={() => handleToggleEstado(a.id)}
                    >
                      {a.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p className="ca-empty">No se encontraron alumnos.</p>}
        </article>
      </div>

      {showCreate && (
        <NuevoAlumnoModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {editing && editing.estado ==='activo' &&(
        <EditarAlumnoModal
          alumno={editing}
          onClose={() => setEditing(null)}
          onSave={(cambios) => handleEditSave(editing.id, cambios)}
        />
      )}
    </article>
  );
}

interface NuevoAlumnoModalProps {
  onClose: () => void;
  onCreate: (data: { nombre: string; matricula: string }) => void;
}

function NuevoAlumnoModal({ onClose, onCreate }: NuevoAlumnoModalProps) {
  const [nombre, setNombre] = useState('');
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState(generarPassword);
  const [copiado, setCopiado] = useState(false);

  function handleRegenerar() {
    setPassword(generarPassword());
    setCopiado(false);
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(password);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nombre.trim() || !matricula.trim()) return;
    onCreate({ nombre: nombre.trim(), matricula: matricula.trim() });
  }

  const correoPreview = matricula.trim() ? correoDeMatricula(matricula) : 'matrícula@alumnos.chapalagutierrez.edu.mx';

  return (
    <article className="ca-modal-overlay">
      <article className="ca-modal" role="dialog" aria-modal="true" aria-labelledby="ca-create-title">
        <article className="ca-modal-header">
          <article>
            <h2 id="ca-create-title" className="ca-modal-title">Nuevo alumno</h2>
            <p className="ca-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </article>

        <form className="ca-modal-form" onSubmit={handleSubmit}>
          <label className="ca-field">
            <span className="ca-field-label">Nombre completo</span>
            <input
              className="ca-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Carlos Díaz Ramírez"
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Matrícula</span>
            <input
              className="ca-input"
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ej. 2026-0142"
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Correo institucional (usuario de acceso)</span>
            <input className="ca-input" type="text" value={correoPreview} readOnly />
          </label>

          <article className="ca-field">
            <span className="ca-field-label">Contraseña temporal generada</span>
            <article className="ca-password-row">
              <input className="ca-input ca-password-input" type="text" value={password} readOnly />
              <button type="button" className="ca-password-btn" onClick={handleRegenerar}>
                Regenerar
              </button>
              <button type="button" className="ca-password-btn" onClick={handleCopiar}>
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </article>
            <p className="ca-field-hint">Se le entrega al alumno para su primer inicio de sesión.</p>
          </article>

          <article className="ca-modal-actions">
            <button type="button" className="ca-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ca-btn-primary">
              Guardar
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}

interface EditarAlumnoModalProps {
  alumno: Alumno;
  onClose: () => void;
  onSave: (data: { nombre: string; matricula: string }) => void;
}

function EditarAlumnoModal({ alumno, onClose, onSave }: EditarAlumnoModalProps) {
  const [nombre, setNombre] = useState(alumno.nombre);
  const [matricula, setMatricula] = useState(alumno.matricula);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nombre.trim() || !matricula.trim()) return;
    onSave({ nombre: nombre.trim(), matricula: matricula.trim() });
  }

  const correoPreview = correoDeMatricula(matricula || alumno.matricula);

  return (
    <article className="ca-modal-overlay">
      <article className="ca-modal" role="dialog" aria-modal="true" aria-labelledby="ca-edit-title">
        <article className="ca-modal-header">
          <article>
            <h2 id="ca-edit-title" className="ca-modal-title">Editar alumno</h2>
            <p className="ca-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </article>

        <form className="ca-modal-form" onSubmit={handleSubmit}>
          <label className="ca-field">
            <span className="ca-field-label">Nombre completo</span>
            <input
              className="ca-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Matrícula</span>
            <input
              className="ca-input"
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Correo institucional (usuario de acceso)</span>
            <input className="ca-input" type="text" value={correoPreview} readOnly />
          </label>

          <article className="ca-modal-actions">
            <button type="button" className="ca-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ca-btn-primary">
              Guardar
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}