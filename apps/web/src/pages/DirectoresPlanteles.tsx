import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DirectorPlantelModal, { type DirectorFormState, isStrongPassword } from '../components/directores/DirectorPlantelModal.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { buildPersonaUsername, createPersona, updatePersona } from '../services/personaService';
import '../styles/CatalogoDirectoresPlantel.css';

interface DirectorPersona {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'DIRECTOR_PLANTEL' | 'ADMIN' | 'COORDINADOR' | 'DOCENTE' | 'ALUMNO';
  activo: boolean;
  plantelId: number;
}

interface PlantelItem {
  id: number;
  nombre: string;
  activo: boolean;
}

const emptyForm: DirectorFormState = {
  nombreCompleto: '',
  email: '',
  plantelId: 0,
  password: '',
};

export default function DirectoresPlanteles() {
  const { toggleSidebar } = useSidebar();
  const [directores, setDirectores] = useState<DirectorPersona[]>([]);
  const [planteles, setPlanteles] = useState<PlantelItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DirectorFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] = useState<DirectorPersona | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadDirectores() {
    try {
      const response = await apiClient.get<DirectorPersona[]>('/api/personas?rol=DIRECTOR_PLANTEL');
      setDirectores(response.data ?? []);
      setFetchError(null);
    } catch {
      setDirectores([]);
      setFetchError('No se pudieron cargar los directores de plantel. Intenta recargar la página.');
    }
  }

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<PlantelItem[]>('/api/planteles');
      const activos = (response.data ?? []).filter((item) => item.activo !== false);
      setPlanteles(activos);
      if (activos.length > 0) {
        setForm((prev) => ({ ...prev, plantelId: prev.plantelId || activos[0].id }));
      }
    } catch {
      setPlanteles([]);
    }
  }

  useEffect(() => {
    void loadDirectores();
    void loadPlanteles();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function splitNombreCompleto(nombreCompleto: string) {
    const limpio = nombreCompleto.trim().replace(/\s+/g, ' ');
    if (!limpio) return { nombre: '', apellido: '' };

    const partes = limpio.split(' ');
    if (partes.length === 1) return { nombre: partes[0], apellido: '-' };

    return {
      nombre: partes[0],
      apellido: partes.slice(1).join(' '),
    };
  }

  function formatearEmailInstitucional(localPart: string) {
    const limpio = localPart.trim().replace(/@.*$/, '').replace(/\s+/g, '');
    if (!limpio) return '';
    return `${limpio}@chapala.edu.mx`;
  }

  function getLocalPart(email: string) {
    return email.trim().split('@')[0] || '';
  }

  function getNombreCompleto(director: DirectorPersona) {
    return `${director.nombre} ${director.apellido}`.trim();
  }

  function getPlantelNombre(plantelId: number) {
    const found = planteles.find((item) => item.id === plantelId);
    return found?.nombre ?? `Plantel ${plantelId}`;
  }

  function handleFormChange(next: DirectorFormState) {
    setForm(next);
    if (hasError || formError) {
      setHasError(false);
      setFormError(null);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      plantelId: planteles[0]?.id ?? 0,
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(director: DirectorPersona) {
    setEditingId(director.id);
    setForm({
      nombreCompleto: getNombreCompleto(director),
      email: getLocalPart(director.email),
      plantelId: director.plantelId,
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError(null);
    setHasError(false);
    setIsValidating(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsValidating(true);

    if (!form.nombreCompleto.trim() || !form.email.trim()) {
      const message = 'Completa nombre completo y correo electrónico oficial.';
      setFormError(message);
      setHasError(true);
      setIsValidating(false);
      return;
    }

    if (!editingId) {
      if (!form.password.trim()) {
        const message = 'Define una contraseña temporal para el director.';
        setFormError(message);
        setHasError(true);
        setIsValidating(false);
        return;
      }

      if (!isStrongPassword(form.password)) {
        const message = 'La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas, número y símbolo.';
        setFormError(message);
        setHasError(true);
        setIsValidating(false);
        return;
      }
    }

    setIsValidating(false);
    setHasError(false);
    setFormError(null);

    const { nombre, apellido } = splitNombreCompleto(form.nombreCompleto);
    if (!nombre || !apellido) {
      setFormError('Ingresa nombre y apellido.');
      return;
    }

    setLoading(true);
    try {
      const plantelId = Number(form.plantelId) || planteles[0]?.id || 0;

      if (!plantelId) {
        setFormError('No hay un plantel disponible para asignar al director.');
        return;
      }

      if (editingId) {
        const response = await updatePersona(editingId, {
          nombre,
          apellido,
          email: formatearEmailInstitucional(form.email),
          plantelId,
          rol: 'DIRECTOR_PLANTEL',
        });
        const updated = response.data as DirectorPersona;
        setDirectores((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setToast('Director actualizado correctamente.');
      } else {
        const emailInstitucional = formatearEmailInstitucional(form.email);
        const username = buildPersonaUsername(emailInstitucional, plantelId);
        const response = await createPersona({
          id: crypto.randomUUID(),
          nombre,
          apellido,
          email: emailInstitucional,
          rol: 'DIRECTOR_PLANTEL',
          activo: true,
          plantelId,
          username,
          password: form.password.trim(),
        });
        const created = response.data as DirectorPersona;
        setDirectores((prev) => [created, ...prev]);
        setToast('Director creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el director.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(director: DirectorPersona) {
    setLoading(true);
    try {
      const response = await updatePersona(director.id, { activo: false });
      const updated = response.data as DirectorPersona;
      setDirectores((prev) => prev.map((item) => (item.id === director.id ? updated : item)));
      setConfirmDeactivate(null);
      setToast('Director desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el director.');
    } finally {
      setLoading(false);
    }
  }

  const filteredDirectores = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return directores;

    return directores.filter((director) => {
      const fullName = getNombreCompleto(director).toLowerCase();
      const plantelNombre = getPlantelNombre(director.plantelId).toLowerCase();
      return fullName.includes(query) || director.email.toLowerCase().includes(query) || plantelNombre.includes(query);
    });
  }, [directores, search, planteles]);

  return (
    <article className="dp-screen">
      <header className="dp-topbar">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Mostrar u ocultar menú"
          className="dp-icon-btn"
        >
          <i className="bi bi-list" />
        </button>
        <span className="dp-topbar-title">Directores de Plantel</span>
      </header>

      <article className="dp-body">
        <header className="dp-header">
          <article>
            <h1 className="dp-title">Directores de Plantel Escolar</h1>
            <p className="dp-subtitle">Asignación y control de directores por sede.</p>
          </article>
        </header>

        <article className="dp-toolbar">
          <article className="dp-search-row">
            <i className="bi bi-search dp-search-icon"></i>
            <input
              className="dp-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en directores de plantel..."
            />
          </article>
          <button className="dp-new-button" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg"></i> Agregar Director
          </button>
        </article>

        <article className="dp-table-wrap">
          <h2 style={{ margin: '1rem 1rem 0' }}>Directores de Plantel Escolar</h2>

          {fetchError && <p className="dp-empty" style={{ paddingTop: 0 }}>{fetchError}</p>}

          {filteredDirectores.length === 0 && !fetchError ? (
            <p className="dp-empty">No hay directores creados aún.</p>
          ) : (
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
                {filteredDirectores.map((director) => (
                  <tr key={director.id} className={director.activo ? '' : 'dp-row-inactivo'}>
                    <td className="dp-td-nombre">{getNombreCompleto(director)}</td>
                    <td className="dp-td-suave">{director.email}</td>
                    <td className="dp-td-suave">{getPlantelNombre(director.plantelId)}</td>
                    <td>
                      <span className={`dp-estado ${director.activo ? 'dp-estado-activo' : 'dp-estado-inactivo'}`}>
                        {director.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="dp-acciones">
                      <button className="dp-btn dp-btn-neutral" type="button" onClick={() => openEditModal(director)}>
                        Editar
                      </button>
                      <button
                        className={`dp-btn ${director.activo ? 'dp-btn-danger' : 'dp-btn-success'}`}
                        type="button"
                        disabled={!director.activo || loading}
                        onClick={() => setConfirmDeactivate(director)}
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

      {isModalOpen && (
        <DirectorPlantelModal
          isOpen={isModalOpen}
          editingId={editingId}
          form={form}
          formError={formError}
          loading={loading || isValidating}
          hasError={hasError}
          isValidating={isValidating}
          planteles={planteles}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
        />
      )}

      {confirmDeactivate && createPortal(
        <article className="dp-modal-overlay">
          <article className="dp-modal">
            <header className="dp-modal-header" style={{ background: 'color-mix(in srgb, var(--seige-error-texto) 88%, var(--ar-profundo))' }}>
              Confirmar
            </header>
            <section className="dp-modal-form">
              <p>¿Deseas desactivar el registro "{getNombreCompleto(confirmDeactivate)}"?</p>
              <p style={{ marginBottom: 0 }}>No se elimina ni su historial, solo deja de estar disponible para asignarse.</p>
            </section>
            <footer className="dp-modal-actions">
              <button type="button" className="dp-btn-secondary" onClick={() => setConfirmDeactivate(null)}>
                Cancelar
              </button>
              <button type="button" className="dp-btn-primary" onClick={() => void handleDeactivate(confirmDeactivate)} style={{ background: 'color-mix(in srgb, var(--seige-error-texto) 88%, white)' }}>
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
