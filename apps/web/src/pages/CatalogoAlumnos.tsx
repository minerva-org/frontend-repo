import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, fetchPersonaByEmail, fetchPersonasByPlantelAndRol, updatePersona, type PersonaRecord } from '../services/personaService';
import '../styles/CatalogoAlumnos.css';
import type { AlumnoFormState } from '../types/AlumnoTypes.ts';
import type { PlantelItem } from '../types/PlantelTypes.ts';
import { ModalAlumnos } from '../components/modals/ModalAlumnos.tsx';

const SAFE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const emptyForm: AlumnoFormState = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  email: '',
  numeroTelefono: '',
  calle: '',
  colonia: '',
  codigoPostal: '',
  municipio: '',
  estado: '',
  plantelId: null,
  password: '',
  nombreTutor: '',
  numeroTutor: '',
  fechaIngreso: '',
};

function isStrongPassword(password: string) {
  return SAFE_PASSWORD_REGEX.test(password.trim());
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
  return [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno,].filter(Boolean).join(' ') ;
}

function getFechaInput(fecha?: string | null) {
  return fecha ? fecha.slice(0, 10) : '';
}

export default function CatalogoAlumnos() {
  const { role, email, selectedPlantel } = useAuth();
  const { toggleSidebar } = useSidebar();
  const canChoosePlantel = role === 'directorGeneral';
  const [alumnos, setAlumnos] = useState<PersonaRecord[]>([]);
  const [planteles, setPlanteles] = useState<PlantelItem[]>([]);
  const [ownPlantelId, setOwnPlantelId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AlumnoFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] =
    useState<PersonaRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activePlantelId = canChoosePlantel
    ? (selectedPlantel?.id ?? planteles[0]?.id ?? null)
    : (ownPlantelId ?? selectedPlantel?.id ?? planteles[0]?.id ?? null);

  useEffect(() => {
    let cancelled = false;

    async function resolveOwnPlantel() {
      if (canChoosePlantel || !email) {
        setOwnPlantelId(null);
        return;
      }

      try {
        const persona = await fetchPersonaByEmail(email);
        if (!cancelled) {
          setOwnPlantelId(persona?.plantelId ?? null);
        }
      } catch {
        if (!cancelled) {
          setOwnPlantelId(null);
        }
      }
    }

    void resolveOwnPlantel();

    return () => {
      cancelled = true;
    };
  }, [canChoosePlantel, email]);

  async function loadAlumnos() {
    if (!activePlantelId) {
      setAlumnos([]);
      return;
    }

    try {
      const response = await fetchPersonasByPlantelAndRol(activePlantelId, 'ALUMNO');
      setAlumnos((response.data ?? []) as PersonaRecord[]);
      setFetchError(null);
    } catch {
      setAlumnos([]);
      setFetchError('No se pudieron cargar los alumnos. Intenta recargar la página.');
    }
  }

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<PlantelItem[]>('/api/planteles');
      const activos = (response.data ?? []).filter((item) => item.activo !== false);
      setPlanteles(activos);
      setForm((prev) => ({
        ...prev,
        plantelId: prev.plantelId ?? activePlantelId ?? activos[0]?.id ?? null,
      }));
    } catch {
      setPlanteles([]);
    }
  }

  useEffect(() => {
    void loadPlanteles();
  }, []);

  useEffect(() => {
    void loadAlumnos();
  }, [activePlantelId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

function openCreateModal() {
  setEditingId(null);
  setForm({
    ...emptyForm,
    plantelId: canChoosePlantel
      ? (selectedPlantel?.id ??planteles[0]?.id ?? null)
      : (activePlantelId ?? planteles[0]?.id ?? null),
  });
  setFormError(null);
  setIsModalOpen(true);
}

function openEditModal(alumno: PersonaRecord) {
    if (alumno.activo === false) return;

    setEditingId(alumno.id);

    setForm({
      nombre: alumno.nombre ?? '',
      apellidoPaterno: alumno.apellidoPaterno ?? '',
      apellidoMaterno: alumno.apellidoMaterno ?? '',
      email: getLocalPart(alumno.email),
      numeroTelefono: alumno.numeroTelefono ?? '',
      calle: alumno.calle ?? '',
      colonia: alumno.colonia ?? '',
      codigoPostal: alumno.codigoPostal ?? '',
      municipio: alumno.municipio ?? '',
      estado: alumno.estado ?? '',
      plantelId: canChoosePlantel
        ? (alumno.plantelId ?? planteles[0]?.id ?? null)
        : (alumno.plantelId ??activePlantelId ?? planteles[0]?.id ?? null),
      password: '',
      nombreTutor: alumno.nombreTutor ?? '',
      numeroTutor: alumno.numeroTutor ?? '',
      fechaIngreso: getFechaInput(alumno.fechaIngreso),
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

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '').trim();

    if (
      !form.nombre.trim() ||
      !form.apellidoPaterno.trim() ||
      !form.email.trim()
    ) {
      setFormError('Completa nombre, apellido paterno y correo institucional.');
      return;
    }

    if (!editingId && !password) {
      setFormError('Define una contraseña temporal para el alumno.');
      return;
    }

    if (!editingId && !isStrongPassword(password)) {
      setFormError(
        'La contraseña debe incluir mayúsculas, minúsculas, números y un símbolo; mínimo 8 caracteres.',
      );
      return;
    }

    const plantelId = canChoosePlantel
      ? form.plantelId
      : (activePlantelId ?? form.plantelId);

    if (!plantelId) {
      setFormError('Selecciona un plantel para el alumno.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellidoPaterno: form.apellidoPaterno.trim(),
        apellidoMaterno: form.apellidoMaterno.trim() || null,
        email: formatearEmailInstitucional(form.email, 'ALUMNO'),
        numeroTelefono: form.numeroTelefono.trim(),
        calle: form.calle.trim(),
        colonia: form.colonia.trim(),
        codigoPostal: form.codigoPostal.trim(),
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        plantelId,
        rol: 'ALUMNO' as const,
        nombreTutor: form.nombreTutor.trim(),
        numeroTutor: form.numeroTutor.trim(),
        fechaIngreso: form.fechaIngreso
          ? new Date(`${form.fechaIngreso}T00:00:00`).toISOString()
          : null,
      };

      if (editingId) {
        const response = await updatePersona(editingId, payload);
        const updated = response.data as PersonaRecord;

        setAlumnos((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item)),
        );

        setToast('Alumno actualizado correctamente.');
      } else {
        const response = await createPersona({
          id: crypto.randomUUID(),
          ...payload,
          activo: true,
          password,
        });

        const created = response.data as PersonaRecord;
        setAlumnos((prev) => [created, ...prev]);
        setToast('Alumno creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo guardar el alumno.',
      );
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

  async function handleActivate(alumno: PersonaRecord) {
    setLoading(true);

    try {
      const response = await updatePersona(alumno.id, { activo: true });
      const updated = response.data as PersonaRecord;

      setAlumnos((prev) =>
        prev.map((item) => (item.id === alumno.id ? updated : item)),
      );

      setToast('Alumno reactivado correctamente.');
    } catch {
      setToast('No se pudo reactivar el alumno.');
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

      <article className="ca-body">
        <header className="ca-header">
          <article>
            <h1 className="ca-title">Catálogo de Alumnos</h1>
            <p className="ca-subtitle">Alumnos de los grupos y planteles que gestionas.</p>
          </article>
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
                      <button
                        type="button"
                        className="ca-link-button"
                        disabled={alumno.activo === false || loading}
                        onClick={() => openEditModal(alumno)}
                      >
                        <i className="bi bi-pencil"></i> Editar
                      </button>
                      <button
                        className={`ca-link-button ${alumno.activo ? 'ca-link-danger' : 'ca-link-success'}`}
                        disabled={loading}
                        onClick={() =>
                          alumno.activo
                            ? setConfirmDeactivate(alumno)
                            : void handleActivate(alumno)
                        }
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
      </article>

      {isModalOpen && createPortal(
        <ModalAlumnos
          alumno={
            editingId
              ? alumnos.find((item) => item.id === editingId) ?? null
              : null
          }
          planteles={planteles}
          form={form}
          formError={formError}
          loading={loading}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={setForm}
          canChoosePlantel={canChoosePlantel}
          hidePlantelField={
            role === 'coordinador' || role === 'directorPlantel'
          }
          defaultPlantelName={
            planteles.find((item) => item.id === activePlantelId)?.nombre ?? 'Plantel'
          }
        />,
        document.body,
      )}

      {confirmDeactivate && createPortal(
        <article className="ca-confirm-backdrop" role="presentation" onClick={() => setConfirmDeactivate(null)}>
          <article className="ca-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="ca-deactivate-title" onClick={(event) => event.stopPropagation()}>
            <header className="ca-confirm-header">
              <article>
                <h2 id="ca-deactivate-title" className="ca-confirm-title">Confirmar desactivación</h2>
                <p className="ca-confirm-subtitle">{getNombreCompleto(confirmDeactivate)}</p>
              </article>
            </header>
            <section className="ca-confirm-body">
              <p className="ca-confirm-text">El alumno dejará de estar disponible para asignaciones, pero conservará su historial.</p>
            </section>
            <article className="ca-confirm-actions">
              <button type="button" className="ca-btn-secondary" onClick={() => setConfirmDeactivate(null)}>
                Cancelar
              </button>
              <button type="button" className="ca-confirm-button" onClick={() => void handleDeactivate(confirmDeactivate)}>
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
  hidePlantelField: boolean;
  defaultPlantelName: string;
}

function AlumnoModal({
  alumno,
  planteles,
  form,
  formError,
  loading,
  onClose,
  onSubmit,
  onChange,
  canChoosePlantel,
  hidePlantelField,
  defaultPlantelName,
}: AlumnoModalProps) {
  return (
    <article className="ca-modal-overlay">
      <article
        className="ca-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ca-modal-title"
      >
        <article className="ca-modal-header">
          <article>
            <h2 id="ca-modal-title" className="ca-modal-title">
              {alumno ? 'Editar alumno' : 'Nuevo alumno'}
            </h2>
            <p className="ca-modal-subtitle">
              Datos personales y escolares del alumno
            </p>
          </article>
        </article>

        <form className="ca-modal-form" onSubmit={onSubmit}>
          <h3>Datos personales</h3>

          <label className="ca-field">
            <span className="ca-field-label">Nombre(s)</span>
            <input
              className="ca-input"
              type="text"
              value={form.nombre}
              onChange={(e) =>
                onChange({ ...form, nombre: e.target.value })
              }
              placeholder="Ej. Carlos"
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Apellido paterno</span>
            <input
              className="ca-input"
              type="text"
              value={form.apellidoPaterno}
              onChange={(e) =>
                onChange({ ...form, apellidoPaterno: e.target.value })
              }
              placeholder="Ej. Díaz"
              required
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Apellido materno</span>
            <input
              className="ca-input"
              type="text"
              value={form.apellidoMaterno}
              onChange={(e) =>
                onChange({ ...form, apellidoMaterno: e.target.value })
              }
              placeholder="Ej. Ramírez"
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Correo institucional</span>
            <article className="ca-email-row">
              <input
                className="ca-input ca-email-input"
                type="text"
                value={form.email}
                onChange={(e) =>
                  onChange({ ...form, email: e.target.value })
                }
                placeholder="ejemplo.alumno"
                required
              />
              <span className="ca-email-domain">
                @alumnos.chapala.edu.mx
              </span>
            </article>
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Número de teléfono</span>
            <input
              className="ca-input"
              type="tel"
              value={form.numeroTelefono}
              onChange={(e) =>
                onChange({ ...form, numeroTelefono: e.target.value })
              }
              placeholder="Ej. 3312345678"
            />
          </label>

          <h3>Domicilio</h3>

          <label className="ca-field">
            <span className="ca-field-label">Calle</span>
            <input
              className="ca-input"
              type="text"
              value={form.calle}
              onChange={(e) =>
                onChange({ ...form, calle: e.target.value })
              }
              placeholder="Nombre de la calle y número"
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Colonia</span>
            <input
              className="ca-input"
              type="text"
              value={form.colonia}
              onChange={(e) =>
                onChange({ ...form, colonia: e.target.value })
              }
              placeholder="Colonia"
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Código postal</span>
            <input
              className="ca-input"
              type="text"
              value={form.codigoPostal}
              onChange={(e) =>
                onChange({ ...form, codigoPostal: e.target.value })
              }
              placeholder="Código postal"
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Municipio</span>
            <input
              className="ca-input"
              type="text"
              value={form.municipio}
              onChange={(e) =>
                onChange({ ...form, municipio: e.target.value })
              }
              placeholder="Municipio"
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Estado</span>
            <input
              className="ca-input"
              type="text"
              value={form.estado}
              onChange={(e) =>
                onChange({ ...form, estado: e.target.value })
              }
              placeholder="Estado"
            />
          </label>

          <h3>Datos escolares</h3>

          {!hidePlantelField && canChoosePlantel ? (
            <label className="ca-field">
              <span className="ca-field-label">Plantel</span>
              <select
                className="ca-input"
                value={form.plantelId ?? ''}
                onChange={(e) =>
                  onChange({
                    ...form,
                    plantelId: Number(e.target.value) || null,
                  })
                }
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
          ) : !hidePlantelField ? (
            <label className="ca-field">
              <span className="ca-field-label">Plantel</span>
              <input
                className="ca-input"
                type="text"
                value={defaultPlantelName}
                readOnly
              />
            </label>
          ) : null}

          <label className="ca-field">
            <span className="ca-field-label">Fecha de ingreso</span>
            <input
              className="ca-input"
              type="date"
              value={form.fechaIngreso}
              onChange={(e) =>
                onChange({ ...form, fechaIngreso: e.target.value })
              }
            />
          </label>

          <h3>Datos del tutor</h3>

          <label className="ca-field">
            <span className="ca-field-label">Nombre del tutor</span>
            <input
              className="ca-input"
              type="text"
              value={form.nombreTutor}
              onChange={(e) =>
                onChange({ ...form, nombreTutor: e.target.value })
              }
              placeholder="Nombre completo del tutor"
            />
          </label>

          <label className="ca-field">
            <span className="ca-field-label">Número de teléfono del tutor</span>
            <input
              className="ca-input"
              type="tel"
              value={form.numeroTutor}
              onChange={(e) =>
                onChange({ ...form, numeroTutor: e.target.value })
              }
              placeholder="Teléfono del tutor"
            />
          </label>

          {!alumno && (
            <>
              <h3>Acceso</h3>

              <label className="ca-field">
                <span className="ca-field-label">Contraseña temporal</span>
                <input
                  className="ca-input"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    onChange({ ...form, password: e.target.value })
                  }
                  placeholder="Contraseña temporal"
                  required
                />
                <small
                  style={{
                    display: 'block',
                    marginTop: '0.35rem',
                    color: 'var(--ca-texto-suave)',
                  }}
                >
                  Debe incluir mayúsculas, minúsculas, números y un símbolo;
                  mínimo 8 caracteres.
                </small>
              </label>
            </>
          )}

          {formError && (
            <p
              className="ca-field-hint"
              style={{ color: 'var(--seige-error-texto)' }}
            >
              {formError}
            </p>
          )}

          <article className="ca-modal-actions">
            <button
              type="button"
              className="ca-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="ca-btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}