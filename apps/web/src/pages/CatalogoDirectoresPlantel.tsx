import { useState } from 'react';
import { useSidebar } from '../context/SidebarContext.tsx';
import '../styles/CatalogoDirectoresPlantel.css';

type EstadoDirector = 'Activo' | 'Inactivo';

interface DirectorPlantel {
  id: string;
  nombre: string;
  correo: string;
  plantelAsignado: string;
  estado: EstadoDirector;
}

const PLANTELES_DISPONIBLES = [
  'Preparatoria Chapala - Sede Centro',
  'Preparatoria Chapala - Sede Norte',
  'Preparatoria Chapala - Sede Valle',
];

const MOCK_DIRECTORES: DirectorPlantel[] = [
  {
    id: 'd1',
    nombre: 'Mtro. Jorge Alberto Ruiz',
    correo: 'jruiz@chapalagutierrez.edu.mx',
    plantelAsignado: 'Preparatoria Chapala - Sede Centro',
    estado: 'Activo',
  },
  {
    id: 'd2',
    nombre: 'Mtra. Carmen Leticia Morales',
    correo: 'cmorales@chapalagutierrez.edu.mx',
    plantelAsignado: 'Preparatoria Chapala - Sede Norte',
    estado: 'Activo',
  },
];

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

type EstadoModal = { tipo: 'nuevo' } | { tipo: 'editar'; director: DirectorPlantel } | null;

export default function CatalogoDirectoresPlantel() {
  const { toggleSidebar } = useSidebar();

  const [directores, setDirectores] = useState<DirectorPlantel[]>(MOCK_DIRECTORES);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<EstadoModal>(null);

  const filtrados = directores.filter(
    (d) =>
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.correo.toLowerCase().includes(search.toLowerCase()) ||
      d.plantelAsignado.toLowerCase().includes(search.toLowerCase()),
  );

  function handleToggleEstado(id: string) {
    setDirectores((prev) =>
      prev.map((d) => (d.id === id ? { ...d, estado: d.estado === 'Activo' ? 'Inactivo' : 'Activo' } : d)),
    );
  }

  function handleGuardar(datos: { nombre: string; correo: string; plantelAsignado: string }) {
    if (modal?.tipo === 'editar') {
      const id = modal.director.id;
      setDirectores((prev) => prev.map((d) => (d.id === id ? { ...d, ...datos } : d)));
    } else {
      setDirectores((prev) => [
        { id: crypto.randomUUID(), estado: 'Activo', ...datos },
        ...prev,
      ]);
    }
    setModal(null);
  }

  return (
    <article className="dp-screen">
      <header className="dp-topbar">
        <button
          className="dp-icon-btn"
          onClick={toggleSidebar}
          title="Mostrar u ocultar menú"
          aria-label="Mostrar u ocultar menú"
        >
          <i className="bi bi-list"></i>
        </button>
        <span className="dp-topbar-title">Directores</span>
      </header>

      <div className="dp-body">
        <header className="dp-header">
          <article>
            <h1 className="dp-title">Directores de Plantel Escolar</h1>
            <p className="dp-subtitle">Autoridades locales de sede.</p>
          </article>
        </header>

        <article className="dp-toolbar">
          <article className="dp-search-row">
            <i className="bi bi-search dp-search-icon"></i>
            <input
              className="dp-search-input"
              type="text"
              placeholder="Buscar en Directores de Plantel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </article>
          <button className="dp-new-button" onClick={() => setModal({ tipo: 'nuevo' })}>
            <i className="bi bi-plus-lg"></i> Agregar Director
          </button>
        </article>

        <article className="dp-table-wrap">
          <table className="dp-table">
            <thead>
              <tr>
                <th>Nombre del director</th>
                <th>Correo institucional</th>
                <th>Plantel asignado</th>
                <th>Estado</th>
                <th className="dp-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((d) => (
                <tr key={d.id} className={d.estado === 'Inactivo' ? 'dp-row-inactivo' : ''}>
                  <td className="dp-td-nombre">{d.nombre}</td>
                  <td className="dp-td-suave">{d.correo}</td>
                  <td className="dp-td-suave">{d.plantelAsignado}</td>
                  <td>
                    <span className={`dp-estado ${d.estado === 'Activo' ? 'dp-estado-activo' : 'dp-estado-inactivo'}`}>
                      {d.estado}
                    </span>
                  </td>
                  <td className="dp-acciones">
                    <button className="dp-btn dp-btn-neutral" onClick={() => setModal({ tipo: 'editar', director: d })}>
                      Editar
                    </button>
                    <button
                      className={`dp-btn ${d.estado === 'Activo' ? 'dp-btn-danger' : 'dp-btn-success'}`}
                      onClick={() => handleToggleEstado(d.id)}
                    >
                      {d.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p className="dp-empty">No se encontraron directores.</p>}
        </article>
      </div>

      {modal && (
        <DirectorModal
          director={modal.tipo === 'editar' ? modal.director : null}
          onCerrar={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </article>
  );
}

interface DirectorModalProps {
  director: DirectorPlantel | null;
  onCerrar: () => void;
  onGuardar: (datos: { nombre: string; correo: string; plantelAsignado: string }) => void;
}

function DirectorModal({ director, onCerrar, onGuardar }: DirectorModalProps) {
  const esEdicion = director !== null;
  const [nombre, setNombre] = useState(director?.nombre ?? '');
  const [correo, setCorreo] = useState(director?.correo ?? '');
  const [plantelAsignado, setPlantelAsignado] = useState(director?.plantelAsignado ?? PLANTELES_DISPONIBLES[0]);
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
    if (!nombre.trim() || !correo.trim() || !plantelAsignado) return;
    onGuardar({ nombre: nombre.trim(), correo: correo.trim(), plantelAsignado });
  }

  return (
    <article className="dp-modal-overlay">
      <article
        className="dp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <article className="dp-modal-header">
          <article>
            <h2 id="dp-modal-title" className="dp-modal-title">
              {esEdicion ? 'Editar director' : 'Agregar director'}
            </h2>
            <p className="dp-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </article>

        <form className="dp-modal-form" onSubmit={handleSubmit}>
          <label className="dp-field">
            <span className="dp-field-label">Nombre completo</span>
            <input
              className="dp-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Mtro. Jorge Alberto Ruiz"
              required
            />
          </label>

          <label className="dp-field">
            <span className="dp-field-label">Correo institucional (usuario de acceso)</span>
            <input
              className="dp-input"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre@chapalagutierrez.edu.mx"
              required
            />
          </label>

          <label className="dp-field">
            <span className="dp-field-label">Plantel asignado</span>
            <select
              className="dp-input"
              value={plantelAsignado}
              onChange={(e) => setPlantelAsignado(e.target.value)}
            >
              {PLANTELES_DISPONIBLES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {!esEdicion && (
            <article className="dp-field">
              <span className="dp-field-label">Contraseña temporal generada</span>
              <article className="dp-password-row">
                <input className="dp-input dp-password-input" type="text" value={password} readOnly />
                <button type="button" className="dp-password-btn" onClick={handleRegenerar}>
                  Regenerar
                </button>
                <button type="button" className="dp-password-btn" onClick={handleCopiar}>
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </article>
              <p className="dp-field-hint">
                Se le entrega al director para su primer inicio de sesión; deberá cambiarla.
              </p>
            </article>
          )}

          <article className="dp-modal-actions">
            <button type="button" className="dp-btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="dp-btn-primary">
              Guardar
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}