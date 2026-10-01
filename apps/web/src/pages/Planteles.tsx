import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { fetchInstituciones } from '../services/institucionService';
import '../styles/CatalogoPlanteles.css';

interface Plantel {
  id: number;
  nombre: string;
  direccion: string;
  institucionId?: number;
  activo: boolean;
}

interface PlantelForm {
  nombre: string;
  direccion: string;
  institucionId: number | null;
}

interface DirectorGeneralInstitucionRef {
  institucionId?: number | null;
  institucion?: { id?: number | null } | null;
  universidadId?: number | null;
}

const emptyForm: PlantelForm = {
  nombre: '',
  direccion: '',
  institucionId: null,
};

const FALLBACK_INSTITUCION_ID = 1;

export default function Planteles() {
  const { toggleSidebar } = useSidebar();
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [instituciones, setInstituciones] = useState<{ id: number; nombre: string }[]>([]);
  const [defaultInstitucionId, setDefaultInstitucionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlantelForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmDeactivate, setConfirmDeactivate] = useState<Plantel | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<Plantel[]>('/api/planteles');
      setPlanteles(response.data ?? []);
      setFetchError(null);
    } catch {
      setPlanteles([]);
      setFetchError('No se pudieron cargar los planteles. Intenta recargar la página.');
    }
  }

  async function loadInstituciones() {
    try {
      const response = await fetchInstituciones();
      const activas = (response.data ?? []).filter((item) => item.id > 0);
      setInstituciones(activas);
      const fallbackInstitucionId = activas[0]?.id ?? null;
      const resolvedDefault = defaultInstitucionId ?? fallbackInstitucionId;
      setForm((prev) => ({
        ...prev,
        institucionId: prev.institucionId ?? resolvedDefault,
      }));
    } catch {
      setInstituciones([]);
    }
  }

  async function loadDirectorGeneralInstitucionId() {
    try {
      const response = await apiClient.get<DirectorGeneralInstitucionRef[]>('/api/personas', {
        params: { rol: 'DIRECTOR_GENERAL' },
      });
      const directorGeneral = (response.data ?? [])[0];

      const resolvedId =
        directorGeneral?.institucionId
        ?? directorGeneral?.institucion?.id
        ?? directorGeneral?.universidadId
        ?? null;

      setDefaultInstitucionId(typeof resolvedId === 'number' ? resolvedId : null);
    } catch {
      setDefaultInstitucionId(null);
    }
  }

  useEffect(() => {
    void loadPlanteles();
    void loadDirectorGeneralInstitucionId();
    void loadInstituciones();
  }, []);

  useEffect(() => {
    if (!defaultInstitucionId) return;
    setForm((prev) => ({
      ...prev,
      institucionId: prev.institucionId ?? defaultInstitucionId,
    }));
  }, [defaultInstitucionId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      institucionId: defaultInstitucionId ?? instituciones[0]?.id ?? FALLBACK_INSTITUCION_ID,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(plantel: Plantel) {
    setEditingId(plantel.id);
    setForm({
      nombre: plantel.nombre,
      direccion: plantel.direccion,
      institucionId: plantel.institucionId ?? defaultInstitucionId ?? instituciones[0]?.id ?? null,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.nombre.trim() || !form.direccion.trim()) {
      setFormError('Completa nombre y dirección del plantel.');
      return;
    }

    const resolvedInstitucionId = form.institucionId
      ?? defaultInstitucionId
      ?? instituciones[0]?.id
      ?? FALLBACK_INSTITUCION_ID;

    setLoading(true);
    try {
      if (editingId) {
        const response = await apiClient.patch<Plantel>(`/api/planteles/${editingId}`, {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
        });
        const updated = response.data;
        setPlanteles((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setToast('Plantel actualizado correctamente.');
      } else {
        const response = await apiClient.post<Plantel>('/api/planteles', {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          institucionId: resolvedInstitucionId,
          activo: true,
        });
        const created = response.data;
        setPlanteles((prev) => [created, ...prev]);
        setToast('Plantel creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el plantel.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(plantel: Plantel) {
    setLoading(true);
    try {
      const response = await apiClient.patch<Plantel>(`/api/planteles/${plantel.id}`, {
        activo: false,
      });
      const updated = response.data;
      setPlanteles((prev) => prev.map((item) => (item.id === plantel.id ? updated : item)));
      setConfirmDeactivate(null);
      setToast('Plantel desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el plantel.');
    } finally {
      setLoading(false);
    }
  }

  const filteredPlanteles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return planteles;
    return planteles.filter((plantel) =>
      plantel.nombre.toLowerCase().includes(query) || plantel.direccion.toLowerCase().includes(query),
    );
  }, [planteles, search]);

  return (
    <article className="pl-screen">
      <header className="pl-topbar">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Mostrar u ocultar menú"
          className="pl-icon-btn"
        >
          <i className="bi bi-list" />
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plantel por nombre o dirección..."
            />
          </article>
          <button className="pl-new-button" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg"></i> Agregar Plantel
          </button>
        </article>

        <article className="pl-table-wrap">
          <h2 style={{ margin: '1rem 1rem 0' }}>Planteles registrados</h2>

          {fetchError && <p className="pl-empty" style={{ paddingTop: 0 }}>{fetchError}</p>}

          {filteredPlanteles.length === 0 && !fetchError ? (
            <p className="pl-empty">No hay planteles registrados aún.</p>
          ) : (
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                  <th className="pl-th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlanteles.map((plantel) => (
                  <tr key={plantel.id} className={plantel.activo ? '' : 'pl-row-inactivo'}>
                    <td className="pl-td-nombre">{plantel.nombre}</td>
                    <td className="pl-td-suave">{plantel.direccion}</td>
                    <td>
                      <span className={`pl-estado ${plantel.activo ? 'pl-estado-activo' : 'pl-estado-inactivo'}`}>
                        {plantel.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="pl-acciones">
                      <button className="pl-btn pl-btn-neutral" type="button" onClick={() => openEditModal(plantel)}>
                        Editar
                      </button>
                      <button
                        className={`pl-btn ${plantel.activo ? 'pl-btn-danger' : 'pl-btn-success'}`}
                        type="button"
                        disabled={!plantel.activo || loading}
                        onClick={() => setConfirmDeactivate(plantel)}
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </article>

      {isModalOpen && createPortal(
        <article className="pl-modal-overlay">
          <article className="pl-modal">
            <header className="pl-modal-header">
              <article>
                <h2 className="pl-modal-title">{editingId ? 'Editar Plantel' : 'Nuevo Plantel'}</h2>
                <p className="pl-modal-subtitle">Preparatoria Chapala Gutiérrez</p>
              </article>
            </header>
            <form onSubmit={handleSubmit} className="pl-modal-form">
              <label className="pl-field">
                <span className="pl-field-label">Nombre completo del plantel</span>
                <input
                  className="pl-input"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                />
              </label>

              <label className="pl-field">
                <span className="pl-field-label">Dirección</span>
                <input
                  className="pl-input"
                  value={form.direccion}
                  onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
                />
              </label>

              {formError && <p className="pl-empty" style={{ padding: 0, textAlign: 'left', color: 'var(--seige-error-texto)' }}>{formError}</p>}

              <footer className="pl-modal-actions">
                <button type="button" onClick={closeModal} className="pl-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="pl-btn-primary">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </footer>
            </form>
          </article>
        </article>,
        document.body,
      )}

      {confirmDeactivate && createPortal(
        <article className="pl-modal-overlay">
          <article className="pl-modal">
            <header className="pl-modal-header" style={{ background: 'color-mix(in srgb, var(--seige-error-texto) 88%, var(--ar-profundo))' }}>
              Confirmar
            </header>
            <section className="pl-modal-form">
              <p>¿Deseas desactivar el registro "{confirmDeactivate.nombre}"?</p>
              <p style={{ marginBottom: 0 }}>No se elimina ni su historial, solo deja de estar disponible para asignarse.</p>
            </section>
            <footer className="pl-modal-actions">
              <button type="button" onClick={() => setConfirmDeactivate(null)} className="pl-btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={() => void handleDeactivate(confirmDeactivate)} className="pl-btn-primary" style={{ background: 'color-mix(in srgb, var(--seige-error-texto) 88%, white)' }}>
                Confirmar
              </button>
            </footer>
          </article>
        </article>,
        document.body,
      )}

      {toast && createPortal(
        <article style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60 }}>
          <section style={{ background: 'var(--ar-profundo)', color: 'var(--seige-superficie)', padding: '10px 14px', borderRadius: 10, boxShadow: '0 12px 30px color-mix(in srgb, var(--ar-profundo) 28%, transparent)' }}>
            {toast}
          </section>
        </article>,
        document.body,
      )}
    </article>
  );
}
