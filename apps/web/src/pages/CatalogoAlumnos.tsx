import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, fetchPersonasByRol, updatePersona, type PersonaRecord } from '../services/personaService';
import '../styles/CatalogoAlumnos.css';

interface AlumnoFormState {
  nombreCompleto: string;
  email: string;
  plantelId: number | null;
  password: string;
}

interface PlantelItem {
  id: number;
  nombre: string;
  activo: boolean;
}

const emptyForm: AlumnoFormState = {
  nombreCompleto: '',
  email: '',
  plantelId: null,
  password: '',
};

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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

function formatearEmailInstitucional(localPart: string, rol: 'ALUMNO' | 'DOCENTE' | 'COORDINADOR' | 'DIRECTOR_PLANTEL') {
  const limpio = localPart.trim().replace(/@.*$/, '').replace(/\s+/g, '');
  if (!limpio) return '';
  const dominio = rol === 'ALUMNO' ? 'alumnos.chapala.edu.mx' : 'chapala.edu.mx';
  return `${limpio}@${dominio}`;
}

function getLocalPart(email: string) {
  return email.trim().split('@')[0] || '';
}

function getNombreCompleto(alumno: PersonaRecord) {
  return `${alumno.nombre} ${alumno.apellido}`.trim();
}

export default function CatalogoAlumnos() {
  const { role, selectedPlantel } = useAuth();
  const { toggleSidebar } = useSidebar();
  const activeRoleLabel = `ROL ACTIVO: ${role ? role.toUpperCase() : '—'}`;
  const canChoosePlantel = role === 'directorGeneral';
  const [alumnos, setAlumnos] = useState<PersonaRecord[]>([]);
  const [planteles, setPlanteles] = useState<PlantelItem[]>([]);
  const defaultPlantelId = selectedPlantel?.id ?? planteles[0]?.id ?? null;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AlumnoFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<PersonaRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadAlumnos() {
    try {
      const response = await fetchPersonasByRol('ALUMNO');
      setAlumnos((response.data ?? []) as PersonaRecord[]);
      setFetchError(null);
    } catch {
      setAlumnos([]);
      setFetchError('No se pudieron cargar los alumnos desde el backend.');
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
    void loadAlumnos();
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
      password: generarPassword(),
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(alumno: PersonaRecord) {
    setEditingId(alumno.id);
    setForm({
      nombreCompleto: getNombreCompleto(alumno),
      email: getLocalPart(alumno.email),
      plantelId: canChoosePlantel ? (alumno.plantelId ?? planteles[0]?.id ?? null) : (selectedPlantel?.id ?? alumno.plantelId ?? planteles[0]?.id ?? null),
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
      setFormError('Completa nombre completo y correo institucional.');
      return;
    }

    if (!editingId && !form.password.trim()) {
      setFormError('Define una contraseña temporal para el alumno.');
      return;
    }

    const { nombre, apellido } = splitNombreCompleto(form.nombreCompleto);
    if (!nombre || !apellido) {
      setFormError('Ingresa nombre y apellido.');
      return;
    }

    if (!form.plantelId) {
      setFormError('Selecciona un plantel para el alumno.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre,
        apellido,
        email: formatearEmailInstitucional(form.email, 'ALUMNO'),
        plantelId: canChoosePlantel ? (form.plantelId ?? defaultPlantelId) : (defaultPlantelId ?? form.plantelId ?? planteles[0]?.id ?? null),
        rol: 'ALUMNO' as const,
      };

      if (editingId) {
        const response = await updatePersona(editingId, payload);
        const updated = response.data as PersonaRecord;
        setAlumnos((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setToast('Alumno actualizado correctamente.');
      } else {
        const response = await createPersona({
          id: crypto.randomUUID(),
          ...payload,
          activo: true,
          password: form.password.trim(),
        });
        const created = response.data as PersonaRecord;
        setAlumnos((prev) => [created, ...prev]);
        setToast('Alumno creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el alumno.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(alumno: PersonaRecord) {
    setLoading(true);
    try {
      const response = await updatePersona(alumno.id, { activo: false });
      const updated = response.data as PersonaRecord;
      setAlumnos((prev) => prev.map((item) => (item.id === alumno.id ? updated : item)));
      setConfirmDeactivate(null);
      setToast('Alumno desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el alumno.');
    } finally {
      setLoading(false);
    }
  }

  const filteredAlumnos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return alumnos;

    return alumnos.filter((alumno) => {
      const fullName = getNombreCompleto(alumno).toLowerCase();
      const email = alumno.email.toLowerCase();
      const plantelNombre = planteles.find((item) => item.id === alumno.plantelId)?.nombre.toLowerCase() ?? '';
      return fullName.includes(query) || email.includes(query) || plantelNombre.includes(query);
    });
  }, [alumnos, search, planteles]);

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
            <h1 className="ca-title">Catálogo de Alumnos</h1>
            <p className="ca-subtitle">Alumnos de los grupos y planteles que gestionas.</p>
          </article>
          <span className="ca-badge">{activeRoleLabel}</span>
        </header>

        <article className="ca-toolbar">
          <article className="ca-search-row">
            <i className="bi bi-search ca-search-icon"></i>
            <input
              className="ca-search-input"
              type="text"
              placeholder="Buscar alumno por nombre, correo o plantel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </article>
          <button className="ca-new-button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg"></i> Nuevo alumno
          </button>
        </article>

        {fetchError && <p className="ca-empty">{fetchError}</p>}

        <article className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo institucional</th>
                <th>Plantel</th>
                <th>Estado</th>
                <th className="ca-th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumnos.map((alumno) => {
                const plantelNombre = planteles.find((item) => item.id === alumno.plantelId)?.nombre ?? `Plantel ${alumno.plantelId ?? '-'}`;
                return (
                  <tr key={alumno.id} className={alumno.activo ? '' : 'ca-row-inactivo'}>
                    <td>
                      <span className="ca-nombre">{getNombreCompleto(alumno)}</span>
                      <span className="ca-correo">{alumno.email}</span>
                    </td>
                    <td>
                      <span className="ca-correo">{alumno.email}</span>
                    </td>
                    <td>
                      <span className="ca-correo">{plantelNombre}</span>
                    </td>
                    <td>
                      <span className={`ca-estado ${alumno.activo ? 'ca-estado-activo' : 'ca-estado-inactivo'}`}>
                        {alumno.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="ca-acciones">
                      <button className="ca-link-button" onClick={() => openEditModal(alumno)}>
                        <i className="bi bi-pencil"></i> Editar
                      </button>
                      <button
                        className={`ca-link-button ${alumno.activo ? 'ca-link-danger' : 'ca-link-success'}`}
                        disabled={loading}
                        onClick={() => (alumno.activo ? setConfirmDeactivate(alumno) : void handleDeactivate(alumno))}
                      >
                        {alumno.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAlumnos.length === 0 && !fetchError && <p className="ca-empty">No se encontraron alumnos.</p>}
        </article>
      </div>

      {isModalOpen && createPortal(
        <AlumnoModal
          alumno={editingId ? alumnos.find((item) => item.id === editingId) ?? null : null}
          planteles={planteles}
          form={form}
          formError={formError}
          loading={loading}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={setForm}
          canChoosePlantel={canChoosePlantel}
          defaultPlantelName={selectedPlantel?.nombre ?? planteles[0]?.nombre ?? 'Plantel'}
        />,
        document.body,
      )}

      {confirmDeactivate && createPortal(
        <article className="ca-modal-overlay">
          <article className="ca-modal" role="alertdialog" aria-modal="true" aria-labelledby="ca-deactivate-title">
            <article className="ca-modal-header">
              <article>
                <h2 id="ca-deactivate-title" className="ca-modal-title">Confirmar desactivación</h2>
                <p className="ca-modal-subtitle">{getNombreCompleto(confirmDeactivate)}</p>
              </article>
            </article>
            <section style={{ padding: '1rem', color: 'var(--ca-texto-suave)' }}>
              <p style={{ marginTop: 0 }}>El alumno dejará de estar disponible para asignaciones, pero conservará su historial.</p>
            </section>
            <article className="ca-modal-actions">
              <button type="button" className="ca-btn-secondary" onClick={() => setConfirmDeactivate(null)}>
                Cancelar
              </button>
              <button type="button" className="ca-btn-primary" onClick={() => void handleDeactivate(confirmDeactivate)}>
                Confirmar
              </button>
            </article>
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

interface AlumnoModalProps {
  alumno: PersonaRecord | null;
  planteles: PlantelItem[];
  form: AlumnoFormState;
  formError: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  onChange: (next: AlumnoFormState) => void;
  canChoosePlantel: boolean;
  defaultPlantelName: string;
}

function AlumnoModal({ alumno, planteles, form, formError, loading, onClose, onSubmit, onChange, canChoosePlantel, defaultPlantelName }: AlumnoModalProps) {
  return (
    <article className="ca-modal-overlay">
      <article className="ca-modal" role="dialog" aria-modal="true" aria-labelledby="ca-modal-title">
        <article className="ca-modal-header">
          <article>
            <h2 id="ca-modal-title" className="ca-modal-title">
              {alumno ? 'Editar alumno' : 'Nuevo alumno'}
            </h2>
            <p className="ca-modal-subtitle">Alta y edición de usuarios alumnos</p>
          </article>
        </article>

        <form className="ca-modal-form" onSubmit={onSubmit}>
          <label className="ca-field">
            <span className="ca-field-label">Nombre completo</span>
            <input
              className="ca-input"
              type="text"
              value={form.nombreCompleto}
              onChange={(e) => onChange({ ...form, nombreCompleto: e.target.value })}
              placeholder="Ej. Carlos Díaz Ramírez"
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Correo institucional</span>
            <div className="ca-email-row">
              <input
                className="ca-input ca-email-input"
                type="text"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                placeholder="ejemplo.alumno"
                required
              />
              <span className="ca-email-domain">@alumnos.chapala.edu.mx</span>
            </div>
          </label>

          {canChoosePlantel ? (
            <label className="ca-field">
              <span className="ca-field-label">Plantel</span>
              <select
                className="ca-input"
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
            <label className="ca-field">
              <span className="ca-field-label">Plantel</span>
              <input className="ca-input" type="text" value={defaultPlantelName} readOnly />
            </label>
          )}

          {!alumno && (
            <label className="ca-field">
              <span className="ca-field-label">Contraseña temporal</span>
              <input
                className="ca-input"
                type="text"
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
                placeholder="Contraseña para primer acceso"
                required
              />
            </label>
          )}

          {formError && <p className="ca-field-hint" style={{ color: 'var(--seige-error-texto)' }}>{formError}</p>}

          <article className="ca-modal-actions">
            <button type="button" className="ca-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ca-btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}
