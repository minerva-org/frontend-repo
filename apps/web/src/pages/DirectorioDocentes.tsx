import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, fetchPersonasByRol, updatePersona, type PersonaRecord } from '../services/personaService';
import '../styles/DirectorioDocentes.css';

interface PlantelItem {
  id: number;
  nombre: string;
  activo: boolean;
}

interface DocenteFormState {
  nombreCompleto: string;
  email: string;
  plantelId: number | null;
  rol: 'DOCENTE' | 'COORDINADOR';
  password: string;
}

const SAFE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const emptyForm: DocenteFormState = {
  nombreCompleto: '',
  email: '',
  plantelId: null,
  rol: 'DOCENTE',
  password: '',
};

function isStrongPassword(password: string) {
  return SAFE_PASSWORD_REGEX.test(password.trim());
}

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

function getNombreCompleto(docente: PersonaRecord) {
  return `${docente.nombre} ${docente.apellido}`.trim();
}

export default function DirectorioDocentes() {
  const { role, selectedPlantel } = useAuth();
  const { toggleSidebar } = useSidebar();
  const canChoosePlantel = role === 'directorGeneral';
  const [docentes, setDocentes] = useState<PersonaRecord[]>([]);
  const [planteles, setPlanteles] = useState<PlantelItem[]>([]);
  const defaultPlantelId = selectedPlantel?.id ?? planteles[0]?.id ?? null;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocenteFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<PersonaRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadDocentes() {
    try {
      const [docentesResponse, coordinadoresResponse] = await Promise.all([
        fetchPersonasByRol('DOCENTE'),
        fetchPersonasByRol('COORDINADOR'),
      ]);
      const docentesCargados = [...(docentesResponse.data ?? []), ...(coordinadoresResponse.data ?? [])] as PersonaRecord[];
      setDocentes(docentesCargados);
      setFetchError(null);
    } catch {
      setDocentes([]);
      setFetchError('No se pudieron cargar los docentes. Intenta recargar la página.');
    }
  }

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<PlantelItem[]>('/api/planteles');
      const activos = (response.data ?? []).filter((item) => item.activo !== false);
      setPlanteles(activos);
      setForm((prev) => ({
        ...prev,
        plantelId: prev.plantelId ?? selectedPlantel?.id ?? activos[0]?.id ?? null,
      }));
    } catch {
      setPlanteles([]);
    }
  }

  useEffect(() => {
    void loadDocentes();
    void loadPlanteles();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      plantelId: canChoosePlantel ? (planteles[0]?.id ?? null) : (selectedPlantel?.id ?? planteles[0]?.id ?? null),
      rol: 'DOCENTE',
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(docente: PersonaRecord) {
    setEditingId(docente.id);
    setForm({
      nombreCompleto: getNombreCompleto(docente),
      email: getLocalPart(docente.email),
      plantelId: canChoosePlantel ? (docente.plantelId ?? planteles[0]?.id ?? null) : (selectedPlantel?.id ?? docente.plantelId ?? planteles[0]?.id ?? null),
      rol: docente.rol === 'COORDINADOR' ? 'COORDINADOR' : 'DOCENTE',
      password: '',
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

    if (!form.nombreCompleto.trim() || !form.email.trim()) {
      setFormError('Completa nombre completo y correo electrónico oficial.');
      return;
    }

    const { nombre, apellido } = splitNombreCompleto(form.nombreCompleto);
    if (!nombre || !apellido) {
      setFormError('Ingresa nombre y apellido.');
      return;
    }

    if (!form.plantelId) {
      setFormError('Selecciona un plantel para el docente.');
      return;
    }

    if (!editingId && !form.password.trim()) {
      setFormError('Define una contraseña temporal para el usuario.');
      return;
    }

    if (!editingId && !isStrongPassword(form.password)) {
      setFormError('La contraseña debe incluir mayúsculas, minúsculas, números y un símbolo; mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre,
        apellido,
        email: formatearEmailInstitucional(form.email),
        plantelId: canChoosePlantel ? (form.plantelId ?? defaultPlantelId) : (defaultPlantelId ?? form.plantelId ?? planteles[0]?.id ?? null),
        rol: form.rol,
      };

      if (editingId) {
        const response = await updatePersona(editingId, payload);
        const updated = response.data as PersonaRecord;
        setDocentes((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setToast('Docente actualizado correctamente.');
      } else {
        const response = await createPersona({
          id: crypto.randomUUID(),
          ...payload,
          activo: true,
          password: form.password.trim(),
        });
        const created = response.data as PersonaRecord;
        setDocentes((prev) => [created, ...prev]);
        setToast('Docente creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el docente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(docente: PersonaRecord) {
    setLoading(true);
    try {
      const response = await updatePersona(docente.id, { activo: false });
      const updated = response.data as PersonaRecord;
      setDocentes((prev) => prev.map((item) => (item.id === docente.id ? updated : item)));
      setConfirmDeactivate(null);
      setToast('Docente desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el docente.');
    } finally {
      setLoading(false);
    }
  }

  const filteredDocentes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return docentes;

    return docentes.filter((docente) => {
      const fullName = getNombreCompleto(docente).toLowerCase();
      const plantelNombre = planteles.find((item) => item.id === docente.plantelId)?.nombre.toLowerCase() ?? '';
      return fullName.includes(query) || docente.email.toLowerCase().includes(query) || plantelNombre.includes(query);
    });
  }, [docentes, search, planteles]);

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
        <span className="dd-topbar-title">Docentes</span>
      </header>

      <div className="dd-body">
        <header className="dd-header">
          <article>
            <h1 className="dd-title">Catálogo de Docentes</h1>
            <p className="dd-subtitle">Docentes de los grupos y planteles que gestionas.</p>
          </article>
        </header>

        <article className="dd-toolbar">
          <article className="dd-search-row">
            <i className="bi bi-search dd-search-icon"></i>
            <input
              className="dd-search-input"
              type="text"
              placeholder="Buscar docente por nombre, correo o plantel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </article>
          <button className="dd-new-button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg"></i> Nuevo docente
          </button>
        </article>

        {fetchError && <p className="dd-empty">{fetchError}</p>}

        <article className="dd-table-wrap">
          <table className="dd-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Plantel</th>
                <th>Estado</th>
                <th className="dd-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocentes.map((docente) => {
                const plantelNombre = planteles.find((item) => item.id === docente.plantelId)?.nombre ?? `Plantel ${docente.plantelId ?? '-'}`;
                return (
                  <tr key={docente.id} className={docente.activo ? '' : 'dd-row-inactivo'}>
                    <td>
                      <span className="dd-nombre">{getNombreCompleto(docente)}</span>
                      <span className="dd-correo">{docente.rol}</span>
                    </td>
                    <td>
                      <span className="dd-correo">{docente.email}</span>
                    </td>
                    <td>
                      <span className="dd-correo">{plantelNombre}</span>
                    </td>
                    <td>
                      <span className={`dd-estado ${docente.activo ? 'dd-estado-activo' : 'dd-estado-inactivo'}`}>
                        {docente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="dd-acciones">
                      <button className="dd-btn dd-btn-neutral" onClick={() => openEditModal(docente)}>
                        Editar
                      </button>
                      <button
                        className={`dd-btn ${docente.activo ? 'dd-btn-danger' : 'dd-btn-success'}`}
                        disabled={loading}
                        onClick={() => (docente.activo ? setConfirmDeactivate(docente) : void handleDeactivate(docente))}
                      >
                        {docente.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDocentes.length === 0 && !fetchError && <p className="dd-empty">No se encontraron docentes.</p>}
        </article>
      </div>

      {isModalOpen && createPortal(
        <DocenteModal
          planteles={planteles}
          docente={editingId ? docentes.find((item) => item.id === editingId) ?? null : null}
          loading={loading}
          form={form}
          formError={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={setForm}
          canChoosePlantel={canChoosePlantel}
          defaultPlantelName={selectedPlantel?.nombre ?? planteles[0]?.nombre ?? 'Plantel'}
        />,
        document.body,
      )}

      {confirmDeactivate && createPortal(
        <div className="dd-confirm-backdrop" role="presentation" onClick={() => setConfirmDeactivate(null)}>
          <article className="dd-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="dd-deactivate-title" onClick={(event) => event.stopPropagation()}>
            <header className="dd-confirm-header">
              <article>
                <h2 id="dd-deactivate-title" className="dd-confirm-title">Confirmar desactivación</h2>
                <p className="dd-confirm-subtitle">{getNombreCompleto(confirmDeactivate)}</p>
              </article>
            </header>
            <section className="dd-confirm-body">
              <p className="dd-confirm-text">El docente dejará de estar disponible para asignaciones, pero conservará su historial.</p>
            </section>
            <article className="dd-confirm-actions">
              <button type="button" className="dd-btn-secondary" onClick={() => setConfirmDeactivate(null)}>
                Cancelar
              </button>
              <button type="button" className="dd-confirm-button" onClick={() => void handleDeactivate(confirmDeactivate)}>
                Confirmar
              </button>
            </article>
          </article>
        </div>,
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

interface DocenteModalProps {
  planteles: PlantelItem[];
  docente: PersonaRecord | null;
  loading: boolean;
  form: DocenteFormState;
  formError: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  onChange: (next: DocenteFormState) => void;
  canChoosePlantel: boolean;
  defaultPlantelName: string;
}

function DocenteModal({ planteles, docente, loading, form, formError, onClose, onSubmit, onChange, canChoosePlantel, defaultPlantelName }: DocenteModalProps) {
  return (
    <article className="dd-modal-overlay">
      <article className="dd-modal" role="dialog" aria-modal="true" aria-labelledby="dd-modal-title">
        <article className="dd-modal-header">
          <article>
            <h2 id="dd-modal-title" className="dd-modal-title">
              {docente ? 'Editar docente' : 'Nuevo docente'}
            </h2>
            <p className="dd-modal-subtitle">Alta y edición de usuarios docentes</p>
          </article>
        </article>

        <form className="dd-modal-form" onSubmit={onSubmit}>
          <label className="dd-field">
            <span className="dd-field-label">Nombre completo</span>
            <input
              className="dd-input"
              type="text"
              value={form.nombreCompleto}
              onChange={(e) => onChange({ ...form, nombreCompleto: e.target.value })}
              placeholder="Ej. Prof. Carlos Méndez"
              required
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Correo institucional</span>
            <div className="dd-email-row">
              <input
                className="dd-input dd-email-input"
                type="text"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                placeholder="ejemplo.nombre"
                required
              />
              <span className="dd-email-domain">@chapala.edu.mx</span>
            </div>
          </label>

          {canChoosePlantel ? (
            <label className="dd-field">
              <span className="dd-field-label">Plantel</span>
              <select
                className="dd-input"
                value={form.plantelId ?? ''}
                onChange={(e) => onChange({ ...form, plantelId: Number(e.target.value) || null })}
                required
              >
                <option value="">Selecciona un plantel</option>
                {planteles.map((plantel) => (
                  <option key={plantel.id} value={plantel.id}>
                    {plantel.nombre}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="dd-field">
              <span className="dd-field-label">Plantel</span>
              <input className="dd-input" type="text" value={defaultPlantelName} readOnly />
            </label>
          )}

          {!docente && (
            <>
              <label className="dd-field">
                <span className="dd-field-label">Rol</span>
                <select
                  className="dd-input"
                  value={form.rol}
                  onChange={(e) => onChange({ ...form, rol: e.target.value as 'DOCENTE' | 'COORDINADOR' })}
                >
                  <option value="DOCENTE">Docente</option>
                  <option value="COORDINADOR">Coordinador</option>
                </select>
              </label>

              <label className="dd-field">
                <span className="dd-field-label">Contraseña temporal</span>
                <input
                  className="dd-input"
                  type="text"
                  value={form.password}
                  onChange={(e) => onChange({ ...form, password: e.target.value })}
                  placeholder="Ej. Doc#2026Segura"
                  required
                />
                <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--dd-texto-suave)' }}>
                  Debe incluir mayúsculas, minúsculas, números y un símbolo; mínimo 8 caracteres.
                </small>
              </label>
            </>
          )}

          {formError && <p className="dd-field-hint" style={{ color: 'var(--seige-error-texto)' }}>{formError}</p>}

          <article className="dd-modal-actions">
            <button type="button" className="dd-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dd-btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}
