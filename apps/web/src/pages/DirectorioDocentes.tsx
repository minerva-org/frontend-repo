import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, fetchPersonaByEmail, fetchPersonasByPlantelAndRol, updatePersona, type PersonaRecord } from '../services/personaService';
import '../styles/DirectorioDocentes.css';
import type { PlantelItem } from '../types/PlantelTypes.ts';
import { DocenteModal } from '../components/ModalDocentes.tsx';
import type { DocenteFormState } from '../types/DocenteTypes.ts';
import type { SubmitEvent } from 'react';


const SAFE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const emptyForm: DocenteFormState = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  calle: '',
  colonia: '',
  codigoPostal: '',
  municipio: '',
  estado: '',
  numeroTelefono: '',
  email: '',
  plantelId: null,
  rol: 'DOCENTE',
  password: '',
  carrera: '',
  tituloEdu: '',
};

function isStrongPassword(password: string) {
  return SAFE_PASSWORD_REGEX.test(password.trim());
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
  return [
    docente.nombre,
    docente.apellidoPaterno,
    docente.apellidoMaterno,
  ].filter((parte) => parte != null && parte.trim() !== '').join(' ');
}

export default function DirectorioDocentes() {
  const { role, email, selectedPlantel } = useAuth();
  const { toggleSidebar } = useSidebar();
  const canChoosePlantel = role === 'directorGeneral';
  const [docentes, setDocentes] = useState<PersonaRecord[]>([]);
  const [coordinadores, setCoordinadores] = useState<PersonaRecord[]>([]);
  const [planteles, setPlanteles] = useState<PlantelItem[]>([]);
  const [ownPlantelId, setOwnPlantelId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocenteFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<PersonaRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activePlantelId = canChoosePlantel
    ? (selectedPlantel?.id ?? planteles[0]?.id ?? null)
    : ownPlantelId;

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

  async function loadDocentes() {
    if (activePlantelId == null) {
      setDocentes([]);
      setCoordinadores([]);
      setFetchError(null);
      return;
    }

    try {
      const [docentesResponse, coordinadoresResponse] = await Promise.all([
        fetchPersonasByPlantelAndRol(activePlantelId, 'DOCENTE'),
        fetchPersonasByPlantelAndRol(activePlantelId, 'COORDINADOR'),
      ]);
      setDocentes(docentesResponse.data);
      setCoordinadores(coordinadoresResponse.data);
      setFetchError(null);
    } catch {
      setDocentes([]);
      setCoordinadores([]);
      setFetchError('No se pudieron cargar los docentes. Intenta recargar la página.');
    }
  }

  const todosDocentes = useMemo(() => [...docentes, ...coordinadores], [docentes, coordinadores]);

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<PlantelItem[]>('/api/planteles');
      const activos = (response.data ?? []).filter((item) => item.activo !== false);
      setPlanteles(activos);
      setForm((prev) => ({
        ...prev,
        plantelId: prev.plantelId ?? activePlantelId ?? selectedPlantel?.id ?? activos[0]?.id ?? null,
      }));
    } catch {
      setPlanteles([]);
    }
  }

  useEffect(() => {
    void loadPlanteles();
  }, []);

  useEffect(() => {
    void loadDocentes();
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
      plantelId: canChoosePlantel ? (selectedPlantel?.id ?? planteles[0]?.id ?? null) : (activePlantelId ??  null),
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(docente: PersonaRecord) {
    if (docente.activo === false) return;

    console.log('DOCENTE SELECCIONADO:', docente);
console.table({
  nombre: docente.nombre,
  apellidoPaterno: docente.apellidoPaterno,
  apellidoMaterno: docente.apellidoMaterno,
  email: docente.email,
  telefono: docente.numeroTelefono,
  calle: docente.calle,
  colonia: docente.colonia,
  codigoPostal: docente.codigoPostal,
  municipio: docente.municipio,
  estado: docente.estado,
  carrera: docente.carrera,
  tituloEdu: docente.tituloEdu,
});

    setEditingId(docente.id);
    setForm({
      ...emptyForm,
      nombre: docente.nombre ?? '',
      apellidoPaterno: docente.apellidoPaterno ?? '',
      apellidoMaterno: docente.apellidoMaterno ?? '',
      email: getLocalPart(docente.email) ?? '',
      calle: docente.calle ?? '',
      colonia: docente.colonia ?? '',
      codigoPostal: docente.codigoPostal ?? '',
      municipio: docente.municipio ?? '',
      estado: docente.estado ?? '',
      numeroTelefono: docente.numeroTelefono ?? '',
      plantelId: canChoosePlantel
        ? (docente.plantelId ?? selectedPlantel?.id ?? null)
        : docente.plantelId ?? activePlantelId ?? null,
      rol: docente.rol === 'COORDINADOR' ? 'COORDINADOR' : 'DOCENTE',
      password: '',
      carrera: docente.carrera ?? '',
      tituloEdu: docente.tituloEdu ?? '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '').trim();

    if(!form.nombre.trim() || !form.apellidoPaterno.trim() || !form.email.trim()){
      setFormError('Completa nombre, apellido y correo electrónico oficial.');
      return;
} 

    if (!editingId && !password) {
      setFormError('Define una contraseña temporal para el usuario.');
      return;
    }

    if (!editingId && !isStrongPassword(password)) {
      setFormError('La contraseña debe incluir mayúsculas, minúsculas, números y un símbolo; mínimo 8 caracteres.');
      return;
    }

    if(!form.carrera.trim() || !form.tituloEdu.trim()){
      setFormError('Ingrese carrera y título educativo.');
      return;
    }
    const plantelId = canChoosePlantel ? form.plantelId : activePlantelId ?? form.plantelId;
    
    if(plantelId == null){
      setFormError('Selecciona un plantel.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellidoPaterno: form.apellidoPaterno.trim(),
        apellidoMaterno: form.apellidoMaterno?.trim() ?? null,
        email: formatearEmailInstitucional(form.email),
        plantelId: plantelId,
        rol: role === 'coordinador' ? 'DOCENTE' : form.rol,
        calle: form.calle.trim(),
        colonia: form.colonia.trim(),
        codigoPostal: form.codigoPostal.trim(),
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        numeroTelefono: form.numeroTelefono.trim(),
        carrera: form.carrera.trim(),
        tituloEdu: form.tituloEdu.trim(),
      };

      if (editingId) {
        const response = await updatePersona(editingId, payload);
        const updated = response.data as PersonaRecord;
        actualizarEnListas(updated);
        setToast('Docente actualizado correctamente.');
      } else {
        const response = await createPersona({
          id: crypto.randomUUID(),
          ...payload,
          activo: true,
          password,
        });
        const created = response.data as PersonaRecord;
        if (created.rol === 'COORDINADOR') {
          setCoordinadores((prev) => [created, ...prev]);
        } else{
        setDocentes((prev) => [created, ...prev]);
        }
        setToast('Docente creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el docente.');
    } finally {
      setLoading(false);
    }
  }

  function actualizarEnListas(updated: PersonaRecord) {
    setCoordinadores((prev) =>
      prev.map((item) => item.id === updated.id ? updated : item)
    );
    setDocentes((prev) =>
      prev.map((item) => item.id === updated.id ? updated : item)
    );
}

  async function handleDeactivate(docente: PersonaRecord) {
    setLoading(true);
    try {
      const response = await updatePersona(docente.id, { activo: false });
      const updated = response.data as PersonaRecord;
      actualizarEnListas(updated);
      setConfirmDeactivate(null);
      setToast('Docente desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el docente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(docente: PersonaRecord) {
    setLoading(true);

    try {
      const response = await updatePersona(docente.id, { activo: true });
      const updated = response.data as PersonaRecord;

      actualizarEnListas(updated);

      setToast('Docente reactivado correctamente.');
    } catch {
      setToast('No se pudo reactivar el docente.');
    } finally {
      setLoading(false);
    }
}

  const filteredDocentes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return todosDocentes;

    return todosDocentes.filter((docente) => {
      const fullName = getNombreCompleto(docente).toLowerCase();
      const plantelNombre = planteles.find((item) => item.id === docente.plantelId)?.nombre.toLowerCase() ?? '';
      return fullName.includes(query) || docente.email.toLowerCase().includes(query) || plantelNombre.includes(query);
    });
  }, [todosDocentes, search, planteles]);

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

      <article className="dd-body">
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
                    <td className="ca-acciones">
                      <button
                        type="button"
                        className="ca-link-button"
                        disabled={docente.activo === false || loading}
                        onClick={() => openEditModal(docente)}
                      >
                        <i className="bi bi-pencil"></i> Editar
                      </button>
                      <button
                        className={`ca-link-button ${docente.activo ? 'ca-link-danger' : 'ca-link-success'}`}
                        disabled={loading}
                        onClick={() =>
                          docente.activo
                            ? setConfirmDeactivate(docente)
                            : void handleActivate(docente)
                        }
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
      </article>

      {isModalOpen && createPortal(
        <DocenteModal
          planteles={planteles}
          docente={editingId ? todosDocentes.find((item) => item.id === editingId) ?? null : null}
          loading={loading}
          form={form}
          formError={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={setForm}
          canChoosePlantel={canChoosePlantel}
          hidePlantelField={role === 'coordinador' || role === 'directorPlantel'}
          hideRoleField={role === 'coordinador'}
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
              <button type="button" className="dd-confirm-button" disabled={loading} onClick={() => void handleDeactivate(confirmDeactivate)}>
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


