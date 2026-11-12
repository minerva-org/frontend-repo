
import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import { createPortal } from 'react-dom';
import DirectorPlantelModal, {
  type DirectorFormState,
  isStrongPassword,
} from '../components/modals/DirectorPlantelModal.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, updatePersona } from '../services/personaService';
import type { PlantelItem } from '../types/PlantelTypes.ts';
import '../styles/CatalogoDirectoresPlantel.css';

interface DirectorPersona {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  rol: 'DIRECTOR_PLANTEL';
  activo: boolean;
  plantelId: number;
  numeroTelefono?: string;
  calle?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  codigoPostal?: string;
}

const initialForm: DirectorFormState = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  email: '',
  numeroTelefono: '',
  calle: '',
  colonia: '',
  municipio: '',
  estado: '',
  codigoPostal: '',
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
  const [form, setForm] = useState<DirectorFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] =
    useState<DirectorPersona | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadDirectores() {
    try {
      const response = await apiClient.get<DirectorPersona[]>(
        '/api/personas?rol=DIRECTOR_PLANTEL',
      );
      setDirectores(response.data ?? []);
      setFetchError(null);
    } catch {
      setDirectores([]);
      setFetchError(
        'No se pudieron cargar los directores de plantel. Intenta recargar la página.',
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

      if (activos.length > 0) {
        setForm((prev) => ({
          ...prev,
          plantelId: prev.plantelId || activos[0].id,
        }));
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

  function formatearEmailInstitucional(localPart: string) {
    const limpio = localPart
      .trim()
      .replace(/@.*$/, '')
      .replace(/\s+/g, '');

    return limpio ? `${limpio}@chapala.edu.mx` : '';
  }

  function getLocalPart(email: string) {
    return email.trim().split('@')[0] || '';
  }

  function getNombreCompleto(director: DirectorPersona) {
    return [
      director.nombre,
      director.apellidoPaterno,
      director.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(' ');
  }

  function getPlantelNombre(plantelId: number) {
    const found = planteles.find((item) => item.id === plantelId);
    return found?.nombre ?? `Plantel ${plantelId}`;
  }

  function existeDirectorActivoEnPlantel(
  plantelId: number,
  excluirDirectorId?: string,
) {
  return directores.some((director) =>
      director.activo &&
      director.plantelId === plantelId &&
      director.id !== excluirDirectorId,
  );}

  function handleFormChange(next: DirectorFormState) {
    setForm(next);
    setFormError(null);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...initialForm,
      plantelId: planteles[0]?.id ?? 0,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(director: DirectorPersona) {
    setEditingId(director.id);

    setForm({
      nombre: director.nombre ?? '',
      apellidoPaterno: director.apellidoPaterno ?? '',
      apellidoMaterno: director.apellidoMaterno ?? '',
      email: getLocalPart(director.email),
      numeroTelefono: director.numeroTelefono ?? '',
      calle: director.calle ?? '',
      colonia: director.colonia ?? '',
      municipio: director.municipio ?? '',
      estado: director.estado ?? '',
      codigoPostal: director.codigoPostal ?? '',
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
    setIsValidating(false);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsValidating(true);
    setFormError(null);

    if (
      !form.nombre.trim() ||
      !form.apellidoPaterno.trim() ||
      !form.apellidoMaterno.trim() ||
      !form.email.trim()
    ) {
      setFormError('Completa nombre, apellidos y correo electrónico oficial.');
      setIsValidating(false);
      return;
    }

    if (!form.numeroTelefono.trim() || !form.calle.trim() ||
        !form.colonia.trim() || !form.municipio.trim() ||
        !form.estado.trim() || !form.codigoPostal.trim()) {
      setFormError('Completa todos los datos de contacto y domicilio.');
      setIsValidating(false);
      return;
    }

    if (!editingId) {
      if (!form.password.trim()) {
        setFormError('Define una contraseña temporal para el director.');
        setIsValidating(false);
        return;
      }

      if (!isStrongPassword(form.password)) {
        setFormError(
          'La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas, número y símbolo.',
        );
        setIsValidating(false);
        return;
      }
    }

    const plantelId = Number(form.plantelId);
    if (!plantelId) {
      setFormError('Selecciona un plantel para asignar al director.');
      setIsValidating(false);
      return;
    }

    setIsValidating(false);
    setLoading(true);

    try {
      const datosPersona = {
        nombre: form.nombre.trim(),
        apellidoPaterno: form.apellidoPaterno.trim(),
        apellidoMaterno: form.apellidoMaterno.trim(),
        email: formatearEmailInstitucional(form.email),
        numeroTelefono: form.numeroTelefono.trim(),
        calle: form.calle.trim(),
        colonia: form.colonia.trim(),
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        codigoPostal: form.codigoPostal.trim(),
        rol: 'DIRECTOR_PLANTEL',
        plantelId,
      };

      if (editingId) {
        const response = await updatePersona(editingId, datosPersona);
        const updated = response.data as DirectorPersona;

        setDirectores((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item)),
        );

        setToast('Director actualizado correctamente.');
      } else {
        const response = await createPersona({
          id: crypto.randomUUID(),
          ...datosPersona,
          activo: true,
          password: form.password,
        });

        const created = response.data as DirectorPersona;

        setDirectores((prev) => [created, ...prev]);
        setToast('Director creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el director.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(director: DirectorPersona) {
    setLoading(true);

    try {
      const response = await updatePersona(director.id, { activo: false });
      const updated = response.data as DirectorPersona;

      setDirectores((prev) =>
        prev.map((item) => (item.id === director.id ? updated : item)),
      );

      setConfirmDeactivate(null);
      setToast('Director desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el director.');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(director: DirectorPersona) {
    setLoading(true);

    try {
      const response = await updatePersona(director.id, { activo: true });
      const updated = response.data as DirectorPersona;

      setDirectores((prev) =>
        prev.map((item) => (item.id === director.id ? updated : item)),
      );

      setToast('Director reactivado correctamente.');
    } catch {
      setToast('No se pudo reactivar el director.');
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

      return (
        fullName.includes(query) ||
        director.email.toLowerCase().includes(query) ||
        plantelNombre.includes(query)
      );
    });
  }, [directores, search, planteles]);

  const plantelesDisponibles = planteles.filter((plantel) =>
  !existeDirectorActivoEnPlantel(plantel.id, editingId ?? undefined),
);

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
            <p className="dp-subtitle">
              Asignación y control de directores por sede.
            </p>
          </article>
        </header>

        <article className="dp-toolbar">
          <article className="dp-search-row">
            <i className="bi bi-search dp-search-icon" />
            <input
              className="dp-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en directores de plantel..."
            />
          </article>

          <button
            className="dp-new-button"
            type="button"
            onClick={openCreateModal}
          >
            <i className="bi bi-plus-lg" /> Agregar Director
          </button>
        </article>

        <article className="dp-table-wrap">
          <h2 style={{ margin: '1rem 1rem 0' }}>
            Directores de Plantel Escolar
          </h2>

          {fetchError && (
            <p className="dp-empty" style={{ paddingTop: 0 }}>
              {fetchError}
            </p>
          )}

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
                  <tr
                    key={director.id}
                    className={director.activo ? '' : 'dp-row-inactivo'}
                  >
                    <td className="dp-td-nombre">
                      {getNombreCompleto(director)}
                    </td>
                    <td className="dp-td-suave">{director.email}</td>
                    <td className="dp-td-suave">
                      {getPlantelNombre(director.plantelId)}
                    </td>
                    <td>
                      <span
                        className={`dp-estado ${
                          director.activo
                            ? 'dp-estado-activo'
                            : 'dp-estado-inactivo'
                        }`}
                      >
                        {director.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="ca-acciones">
                      <button
                        type="button"
                        className="ca-link-button"
                        disabled={!director.activo || loading}
                        onClick={() => openEditModal(director)}
                      >
                        <i className="bi bi-pencil" /> Editar
                      </button>

                      <button
                        type="button"
                        className={`ca-link-button ${
                          director.activo
                            ? 'ca-link-danger'
                            : 'ca-link-success'
                        }`}
                        disabled={loading}
                        onClick={() =>
                          director.activo
                            ? setConfirmDeactivate(director)
                            : void handleActivate(director)
                        }
                      >
                        {director.activo ? 'Desactivar' : 'Reactivar'}
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
          isValidating={isValidating}
          planteles={plantelesDisponibles}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
        />
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
              aria-labelledby="dp-deactivate-title"
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
                      id="dp-deactivate-title"
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
                  <p className="mb-2">
                    ¿Deseas desactivar al director{' '}
                    <strong>{getNombreCompleto(confirmDeactivate)}</strong>?
                  </p>

                  <p className="mb-0">
                    No se elimina ni su historial, solo deja de estar disponible
                    para asignarse.
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
                    disabled={loading}
                    onClick={() => void handleDeactivate(confirmDeactivate)}
                  >
                    {loading ? 'Desactivando...' : 'Desactivar'}
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
