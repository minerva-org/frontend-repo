import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import '../styles/DirectorioDocentes.css';

type RolDocente = 'docente' | 'coordinador';
type EstadoDocente = 'activo' | 'inactivo';

interface Docente {
  id: string;
  nombre: string;
  correo: string;
  rol: RolDocente;
  estado: EstadoDocente;
}

const MOCK_DOCENTES: Docente[] = [
  { id: '1', nombre: 'Prof. García', correo: 'garcia@chapalagutierrez.edu.mx', rol: 'docente', estado: 'activo' },
  { id: '2', nombre: 'Prof. Ruiz', correo: 'ruiz@chapalagutierrez.edu.mx', rol: 'docente', estado: 'activo' },
  { id: '3', nombre: 'Profa. Méndez', correo: 'mendez@chapalagutierrez.edu.mx', rol: 'coordinador', estado: 'activo' },
  { id: '4', nombre: 'Prof. López', correo: 'lopez@chapalagutierrez.edu.mx', rol: 'docente', estado: 'inactivo' },
];

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function DirectorioDocentes() {
  const { role } = useAuth();
  const activeRole = role;
  const { toggleSidebar } = useSidebar();
  const puedeAsignarRol = activeRole === 'directorPlantel';
  const ambito = activeRole === 'directorPlantel' ? 'Sede Central' : 'Tus grupos';

  const [docentes, setDocentes] = useState<Docente[]>(MOCK_DOCENTES);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Docente | null>(null);

  const filtrados = docentes.filter(
    (d) =>
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.correo.toLowerCase().includes(search.toLowerCase())
  );

  function handleCambiarRol(id: string, nuevoRol: RolDocente) {
    setDocentes((prev) => prev.map((d) => (d.id === id ? { ...d, rol: nuevoRol } : d)));
  }

  function handleToggleEstado(id: string) {
    setDocentes((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, estado: d.estado === 'activo' ? 'inactivo' : 'activo' } : d
      )
    );
  }

  function handleCreate(nuevo: { nombre: string; correo: string }) {
    const docente: Docente = {
      id: crypto.randomUUID(),
      nombre: nuevo.nombre,
      correo: nuevo.correo,
      rol: 'docente',
      estado: 'activo',
    };
    setDocentes((prev) => [docente, ...prev]);
    setShowModal(false);
  }

  function handleEditSave(id: string, cambios: { nombre: string; correo: string }) {
    setDocentes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, nombre: cambios.nombre, correo: cambios.correo } : d))
    );
    setEditing(null);
  }

  return (
    <article className="dd-screen">
      <header className="dd-topbar">
        <button
          className="dd-icon-btn"
          onClick={toggleSidebar}
          title="Mostrar u ocultar menú"
          aria-label="Mostrar u ocultar menú"
        >
          <i className="bi bi-list"></i>
        </button>
        <span className="dd-topbar-title">
          {activeRole === 'directorPlantel' ? 'Plantel' : 'Docentes'}
        </span>
      </header>

      <div className="dd-body">
        <header className="dd-header">
          <article>
            <h1 className="dd-title">
              {activeRole === 'directorPlantel' ? 'Tablero Directivo de Plantel' : 'Catálogo de Docentes'}
            </h1>
            <p className="dd-subtitle">
              {activeRole === 'directorPlantel'
                ? 'Supervisión de indicadores de reproducción, cumplimiento docente y riesgo formativo local.'
                : 'Docentes de los grupos que coordinas.'}
            </p>
          </article>
          <span className="dd-badge">
            {activeRole === 'directorPlantel' ? 'Rol Activo: Director Plantel' : 'Rol Activo: Coordinador'}
          </span>
        </header>

        <article className="dd-scope-row">
          <p className="dd-scope-text">
            <strong>Ámbito Operativo:</strong> Asignaturas y grupos bajo tu titularidad académica · {ambito}
          </p>
          <button className="dd-new-button" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg"></i> Nuevo docente
          </button>
        </article>

        <article className="dd-search-row">
          <i className="bi bi-search dd-search-icon"></i>
          <input
            className="dd-search-input"
            type="text"
            placeholder="Buscar docente por nombre o materia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </article>

        <article className="dd-table-wrap">
          <table className="dd-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="dd-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((d) => (
                <tr key={d.id} className={d.estado === 'inactivo' ? 'dd-row-inactivo' : ''}>
                  <td>
                    <span className="dd-nombre">{d.nombre}</span>
                    <span className="dd-correo">{d.correo}</span>
                  </td>
                  <td>
                    <select
                      className="dd-rol-select"
                      value={d.rol}
                      disabled={!puedeAsignarRol || d.estado === 'inactivo'}
                      onChange={(e) => handleCambiarRol(d.id, e.target.value as RolDocente)}
                    >
                      <option value="docente">Docente</option>
                      <option value="coordinador">Coordinador</option>
                    </select>
                  </td>
                  <td>
                    <span className={`dd-estado ${d.estado === 'activo' ? 'dd-estado-activo' : 'dd-estado-inactivo'}`}>
                      {d.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="dd-acciones">
                    <button
                      className="dd-link-button"
                      disabled={d.estado === 'inactivo'}
                      title={d.estado === 'inactivo' ? 'Reactiva al docente para poder editarlo' : undefined}
                      onClick={() => setEditing(d)}
                    >
                      <i className="bi bi-pencil"></i> Editar
                    </button>
                    <button
                      className={`dd-link-button ${d.estado === 'activo' ? 'dd-link-danger' : 'dd-link-success'}`}
                      onClick={() => handleToggleEstado(d.id)}
                    >
                      {d.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p className="dd-empty">No se encontraron docentes.</p>}
        </article>
      </div>

      {showModal && (
        <NuevoDocenteModal
          puedeAsignarRol={puedeAsignarRol}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {editing && (
        <EditarDocenteModal
          docente={editing}
          puedeAsignarRol={puedeAsignarRol}
          onClose={() => setEditing(null)}
          onSave={(cambios) => handleEditSave(editing.id, cambios)}
        />
      )}
    </article>
  );
}

interface NuevoDocenteModalProps {
  puedeAsignarRol: boolean;
  onClose: () => void;
  onCreate: (data: { nombre: string; correo: string }) => void;
}

function NuevoDocenteModal({ puedeAsignarRol, onClose, onCreate }: NuevoDocenteModalProps) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
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
    if (!nombre.trim() || !correo.trim()) return;
    onCreate({ nombre: nombre.trim(), correo: correo.trim() });
  }

  return (
    <article className="dd-modal-overlay">
      <article
        className="dd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dd-modal-title"
      >
        <article className="dd-modal-header">
          <article>
            <h2 id="dd-modal-title" className="dd-modal-title">Nuevo docente</h2>
            <p className="dd-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </article>

        <form className="dd-modal-form" onSubmit={handleSubmit}>
          <label className="dd-field">
            <span className="dd-field-label">Nombre completo</span>
            <input
              className="dd-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Prof. Carlos Méndez"
              required
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Correo institucional (usuario de acceso)</span>
            <input
              className="dd-input"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre@chapalagutierrez.edu.mx"
              required
            />
          </label>

          <article className="dd-field">
            <span className="dd-field-label">Contraseña temporal generada</span>
            <article className="dd-password-row">
              <input className="dd-input dd-password-input" type="text" value={password} readOnly />
              <button type="button" className="dd-password-btn" onClick={handleRegenerar}>
                Regenerar
              </button>
              <button type="button" className="dd-password-btn" onClick={handleCopiar}>
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </article>
            <p className="dd-field-hint">
              Se le entrega al docente para su primer inicio de sesión; deberá cambiarla.
            </p>
          </article>

          <label className="dd-field">
            <span className="dd-field-label">Rol</span>
            <select className="dd-input" defaultValue="docente" disabled={!puedeAsignarRol}>
              <option value="docente">Docente</option>
              <option value="coordinador">Coordinador</option>
            </select>
            {!puedeAsignarRol && (
              <p className="dd-field-hint">
                <i className="bi bi-lock-fill"></i> Solo el Director de Plantel puede otorgar o cambiar el rol
              </p>
            )}
          </label>

          <article className="dd-modal-actions">
            <button type="button" className="dd-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dd-btn-primary">
              Guardar
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}

interface EditarDocenteModalProps {
  docente: Docente;
  puedeAsignarRol: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; correo: string }) => void;
}

function EditarDocenteModal({ docente, puedeAsignarRol, onClose, onSave }: EditarDocenteModalProps) {
  const [nombre, setNombre] = useState(docente.nombre);
  const [correo, setCorreo] = useState(docente.correo);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;
    onSave({ nombre: nombre.trim(), correo: correo.trim() });
  }

  return (
    <article className="dd-modal-overlay">
      <article className="dd-modal" role="dialog" aria-modal="true" aria-labelledby="dd-edit-title">
        <article className="dd-modal-header">
          <article>
            <h2 id="dd-edit-title" className="dd-modal-title">Editar docente</h2>
            <p className="dd-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </article>

        <form className="dd-modal-form" onSubmit={handleSubmit}>
          <label className="dd-field">
            <span className="dd-field-label">Nombre completo</span>
            <input
              className="dd-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Correo institucional (usuario de acceso)</span>
            <input
              className="dd-input"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Rol</span>
            <select className="dd-input" value={docente.rol} disabled>
              <option value="docente">Docente</option>
              <option value="coordinador">Coordinador</option>
            </select>
            <p className="dd-field-hint">
              El rol se cambia desde la tabla{puedeAsignarRol ? '' : '; solo el Director de Plantel puede hacerlo'}.
            </p>
          </label>

          <article className="dd-modal-actions">
            <button type="button" className="dd-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dd-btn-primary">
              Guardar
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}