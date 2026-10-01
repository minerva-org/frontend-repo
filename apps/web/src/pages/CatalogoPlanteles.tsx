import { useState, type SubmitEvent } from 'react';
import { useSidebar } from '../context/SidebarContext.tsx';
import AutocompleteInput from '../components/AutoCompleteInput.tsx';
import '../styles/CatalogoPlanteles.css';

type EstadoPlantel = 'Activo' | 'Inactivo';

interface Plantel {
  id: string;
  nombre: string;
  universidad: string;
  direccion: string;
  estado: EstadoPlantel;
}

const MOCK_PLANTELES: Plantel[] = [
  {
    id: 'p1',
    nombre: 'Preparatoria Chapala - Sede Centro',
    universidad: 'Tecnológico Nacional de México',
    direccion: 'Av. Álvaro Obregón 450 Col. Centro',
    estado: 'Activo',
  },
  {
    id: 'p2',
    nombre: 'Preparatoria Chapala - Sede Norte',
    universidad: 'Tecnológico Nacional de México',
    direccion: 'Blvd. Pedro Infante 1200',
    estado: 'Activo',
  },
  {
    id: 'p3',
    nombre: 'Preparatoria Chapala - Sede Valle',
    universidad: 'Tecnológico Nacional de México',
    direccion: 'Calzada Aeropuerto 320',
    estado: 'Inactivo',
  },
];


const MOCK_UNIVERSIDADES = [
  'Tecnológico Nacional de México',
  'Universidad de Guadalajara',
  'Universidad Autónoma de México',
];

type EstadoModal = { tipo: 'nuevo' } | { tipo: 'editar'; plantel: Plantel } | null;

export default function CatalogoPlanteles() {
  const { toggleSidebar } = useSidebar();

  const [planteles, setPlanteles] = useState<Plantel[]>(MOCK_PLANTELES);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<EstadoModal>(null);

  const filtrados = planteles.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.universidad.toLowerCase().includes(search.toLowerCase()) ||
      p.direccion.toLowerCase().includes(search.toLowerCase()),
  );

  function handleToggleEstado(id: string) {
    setPlanteles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: p.estado === 'Activo' ? 'Inactivo' : 'Activo' } : p)),
    );
  }

  function handleGuardar(datos: { nombre: string; universidad: string; direccion: string }) {
    if (modal?.tipo === 'editar') {
      const id = modal.plantel.id;
      setPlanteles((prev) => prev.map((p) => (p.id === id ? { ...p, ...datos } : p)));
    } else {
      setPlanteles((prev) => [
        { id: crypto.randomUUID(), estado: 'Activo', ...datos },
        ...prev,
      ]);
    }
    setModal(null);
  }

  return (
    <article className="pl-screen">
      <header className="pl-topbar">
        <button
          className="pl-icon-btn"
          onClick={toggleSidebar}
          title="Mostrar u ocultar menú"
          aria-label="Mostrar u ocultar menú"
        >
          <i className="bi bi-list"></i>
        </button>
        <span className="pl-topbar-title">Planteles</span>
      </header>

      <article className="pl-body">
        <header className="pl-header">
          <article>
            <h1 className="pl-title">Sedes y Planteles Académicos</h1>
            <p className="pl-subtitle">Gestión de planteles escolares.</p>
          </article>
        </header>

        <article className="pl-toolbar">
          <article className="pl-search-row">
            <i className="bi bi-search pl-search-icon"></i>
            <input
              className="pl-search-input"
              type="text"
              placeholder="Buscar en Planteles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </article>
          <button className="pl-new-button" onClick={() => setModal({ tipo: 'nuevo' })}>
            <i className="bi bi-plus-lg"></i> Agregar Plantel
          </button>
        </article>

        <article className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>Nombre del plantel</th>
                <th>Universidad</th>
                <th>Dirección física</th>
                <th>Estado</th>
                <th className="pl-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className={p.estado === 'Inactivo' ? 'pl-row-inactivo' : ''}>
                  <td className="pl-td-nombre">{p.nombre}</td>
                  <td className="pl-td-suave">{p.universidad}</td>
                  <td className="pl-td-suave">{p.direccion}</td>
                  <td>
                    <span className={`pl-estado ${p.estado === 'Activo' ? 'pl-estado-activo' : 'pl-estado-inactivo'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="pl-acciones">
                    <button className="pl-btn pl-btn-neutral" onClick={() => setModal({ tipo: 'editar', plantel: p })}>
                      Editar
                    </button>
                    <button
                      className={`pl-btn ${p.estado === 'Activo' ? 'pl-btn-danger' : 'pl-btn-success'}`}
                      onClick={() => handleToggleEstado(p.id)}
                    >
                      {p.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p className="pl-empty">No se encontraron planteles.</p>}
        </article>
      </article>

      {modal && (
        <PlantelModal
          plantel={modal.tipo === 'editar' ? modal.plantel : null}
          onCerrar={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </article>
  );
}

interface PlantelModalProps {
  plantel: Plantel | null;
  onCerrar: () => void;
  onGuardar: (datos: { nombre: string; universidad: string; direccion: string }) => void;
}

function PlantelModal({ plantel, onCerrar, onGuardar }: PlantelModalProps) {
  const esEdicion = plantel !== null;
  const [nombre, setNombre] = useState(plantel?.nombre ?? '');
  const [universidad, setUniversidad] = useState<string[]>(plantel?.universidad ? [plantel.universidad] : []);
  const [direccion, setDireccion] = useState(plantel?.direccion ?? '');

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nombre.trim() || universidad.length === 0 || !direccion.trim()) return;
    onGuardar({ nombre: nombre.trim(), universidad: universidad[0], direccion: direccion.trim() });
  }

  return (
    <article className="pl-modal-overlay">
      <article
        className="pl-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pl-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <article className="pl-modal-header">
          <article>
            <h2 id="pl-modal-title" className="pl-modal-title">
              {esEdicion ? 'Editar plantel' : 'Agregar plantel'}
            </h2>
            <p className="pl-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </article>

        <form className="pl-modal-form" onSubmit={handleSubmit}>
          <label className="pl-field">
            <span className="pl-field-label">Nombre del plantel</span>
            <input
              className="pl-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Preparatoria Chapala - Sede Centro"
              required
            />
          </label>

          <AutocompleteInput
            label="Universidad"
            placeholder="Buscar universidad..."
            options={MOCK_UNIVERSIDADES}
            selected={universidad}
            onChange={setUniversidad}
          />

          <label className="pl-field">
            <span className="pl-field-label">Dirección física</span>
            <input
              className="pl-input"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Av. Álvaro Obregón 450 Col. Centro"
              required
            />
          </label>

          <article className="pl-modal-actions">
            <button type="button" className="pl-btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="pl-btn-primary">
              Guardar
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}