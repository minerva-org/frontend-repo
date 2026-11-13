import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import {
  createPersona,
  fetchPersonaByEmail,
  fetchPersonasByPlantelAndRol,
  updatePersona,
  type PersonaRecord,
} from '../services/personaService';
import '../styles/CatalogoAlumnos.css';
import type { AlumnoFormState } from '../types/AlumnoTypes.ts';
import type { PlantelItem } from '../types/PlantelTypes.ts';
import { ModalAlumnos } from '../components/modals/ModalAlumnos.tsx';

const SAFE_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const PHONE_REGEX = /^\d{10}$/;
const POSTAL_CODE_REGEX = /^\d{5}$/;
const EMAIL_LOCAL_REGEX = /^[a-zA-Z0-9._%+-]+$/;

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

function formatearEmailInstitucional(localPart: string) {
  const limpio = localPart.trim().replace(/\s+/g, '');

  if (!limpio) return '';

  return `${limpio}@chapala.edu.mx`;
}

function getLocalPart(email: string) {
  return email.trim().split('@')[0] || '';
}

function getNombreCompleto(alumno: PersonaRecord) {
  return [
    alumno.nombre,
    alumno.apellidoPaterno,
    alumno.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(' ');
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
      const response = await fetchPersonasByPlantelAndRol(
        activePlantelId,
        'ALUMNO',
      );

      setAlumnos((response.data ?? []) as PersonaRecord[]);
      setFetchError(null);
    } catch {
      setAlumnos([]);
      setFetchError(
        'No se pudieron cargar los alumnos. Intenta recargar la página.',
      );
    }
  }

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<PlantelItem[]>('/api/planteles');

      const activos = (response.data ?? []).filter(
        (item) => item.activo !== false,
      );

      setPlanteles(activos);

      setForm((prev) => ({
        ...prev,
        plantelId:
          prev.plantelId ?? activePlantelId ?? activos[0]?.id ?? null,
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
        ? (selectedPlantel?.id ?? planteles[0]?.id ?? null)
        : (activePlantelId ?? planteles[0]?.id ?? null),
    });

    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(alumno: PersonaRecord) {
    if (alumno.activo === false) return;

    setEditingId(alumno.id);
    console.log('Alumno seleccionado:', alumno);
    console.log('Nombre tutor:', alumno.nombreTutor);
    console.log('Teléfono tutor:', alumno.numeroTutor);
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
        : (alumno.plantelId ?? activePlantelId ?? planteles[0]?.id ?? null),
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

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const password = form.password.trim();
    const emailLocal = form.email.trim();

    if (
      !form.nombre.trim() ||
      !form.apellidoPaterno.trim() ||
      !emailLocal ||
      !form.numeroTelefono.trim() ||
      !form.codigoPostal.trim()
    ) {
      setFormError(
        'Completa nombre, apellido paterno, correo institucional, teléfono y código postal.',
      );
      return;
    }

    if (!EMAIL_LOCAL_REGEX.test(emailLocal)) {
      setFormError(
        'Ingresa un nombre de correo válido, sin espacios ni otro dominio.',
      );
      return;
    }

    if (!PHONE_REGEX.test(form.numeroTelefono.trim())) {
      setFormError('El teléfono debe contener exactamente 10 dígitos.');
      return;
    }

    if (!POSTAL_CODE_REGEX.test(form.codigoPostal.trim())) {
      setFormError('El código postal debe contener exactamente 5 dígitos.');
      return;
    }

    if (
      form.numeroTutor.trim() &&
      !PHONE_REGEX.test(form.numeroTutor.trim())
    ) {
      setFormError(
        'El teléfono del tutor debe contener exactamente 10 dígitos.',
      );
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
        email: formatearEmailInstitucional(emailLocal),
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

      setAlumnos((prev) =>
        prev.map((item) => (item.id === alumno.id ? updated : item)),
      );

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
      const alumnoEmail = alumno.email.toLowerCase();

      const plantelNombre =
        planteles
          .find((item) => item.id === alumno.plantelId)
          ?.nombre.toLowerCase() ?? '';

      return (
        fullName.includes(query) ||
        alumnoEmail.includes(query) ||
        plantelNombre.includes(query)
      );
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
            <p className="ca-subtitle">
              Alumnos de los grupos y planteles que gestionas.
            </p>
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
                const plantelNombre =
                  planteles.find((item) => item.id === alumno.plantelId)
                    ?.nombre ?? `Plantel ${alumno.plantelId ?? '-'}`;

                return (
                  <tr
                    key={alumno.id}
                    className={alumno.activo ? '' : 'ca-row-inactivo'}
                  >
                    <td>
                      <span className="ca-nombre">
                        {getNombreCompleto(alumno)}
                      </span>
                      <span className="ca-correo">{alumno.email}</span>
                    </td>

                    <td>
                      <span className="ca-correo">{alumno.email}</span>
                    </td>

                    <td>
                      <span className="ca-correo">{plantelNombre}</span>
                    </td>

                    <td>
                      <span
                        className={`ca-estado ${
                          alumno.activo
                            ? 'ca-estado-activo'
                            : 'ca-estado-inactivo'
                        }`}
                      >
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
                        className={`ca-link-button ${
                          alumno.activo
                            ? 'ca-link-danger'
                            : 'ca-link-success'
                        }`}
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

          {filteredAlumnos.length === 0 && !fetchError && (
            <p className="ca-empty">No se encontraron alumnos.</p>
          )}
        </article>
      </article>

      {isModalOpen &&
        createPortal(
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
              planteles.find((item) => item.id === activePlantelId)?.nombre ??
              'Plantel'
            }
          />,
          document.body,
        )}

      {confirmDeactivate &&
        createPortal(
          <article
            className="modal show d-block"
            tabIndex={-1}
            role="presentation"
            onClick={() => setConfirmDeactivate(null)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1055,
            }}
          >
            <article
              className="modal-dialog modal-dialog-centered"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="ca-deactivate-title"
              onClick={(event) => event.stopPropagation()}
            >
              <article className="modal-content border-0 shadow rounded-4 overflow-hidden">
                <header
                  className="modal-header text-white"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--ar-profundo), var(--ar-azul))',
                  }}
                >
                  <article>
                    <h5
                      id="ca-deactivate-title"
                      className="modal-title fw-bold text-white"
                    >
                      Confirmar desactivación
                    </h5>

                    <p className="mb-0 small text-white opacity-75">
                      {getNombreCompleto(confirmDeactivate)}
                    </p>
                  </article>
                </header>

                <section className="modal-body py-4">
                  <p className="mb-0">
                    ¿Desea dar de baja al alumno <strong>{confirmDeactivate.nombre}</strong>? no podrá asignarlo a mas grupos
                  </p>
                </section>

                <footer className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setConfirmDeactivate(null)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void handleDeactivate(confirmDeactivate)}
                  >
                    Desactivar
                  </button>
                </footer>
              </article>
            </article>
          </article>,
          document.body,
        )}

      {toast &&
        createPortal(
          <article
            style={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              zIndex: 60,
            }}
          >
            <section
              style={{
                background: 'var(--ar-profundo)',
                color: 'var(--seige-superficie)',
                padding: '10px 14px',
                borderRadius: 10,
                boxShadow:
                  '0 12px 30px color-mix(in srgb, var(--ar-profundo) 28%, transparent)',
              }}
            >
              {toast}
            </section>
          </article>,
          document.body,
        )}
    </article>
  );
}