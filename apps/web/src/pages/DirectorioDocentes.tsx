import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, fetchPersonaByEmail, fetchPersonasByPlantelAndRol, updatePersona, type PersonaRecord } from '../services/personaService';
import '../styles/DirectorioDocentes.css';
import type { PlantelItem } from '../types/PlantelTypes.ts';
import { DocenteModal } from '../components/modals/ModalDocentes.tsx';
import type { DocenteFormState } from '../types/DocenteTypes.ts';
import type { SubmitEvent } from 'react';
import Toast, {type ToastData} from '../components/common/Toast.tsx';


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
  const [toast, setToast] = useState<ToastData | null>(null);
  const cerrarToast = useCallback(() => {setToast(null);},[]);
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

    if(!form.nombre.trim() || !form.apellidoPaterno.trim() || !form.apellidoMaterno?.trim() || !form.email.trim()){
      setFormError('Completa nombre, apellido y correo electrónico oficial.');
      return;
} 

    if (!form.calle.trim() || !form.colonia.trim() || !form.municipio.trim() || (!editingId && ( !form.estado.trim() 
        || !form.numeroTelefono.trim() || !form.codigoPostal.trim()))) {
      setFormError('Completa los campos de domicilio y contacto.');
      return;
    }

    if (form.numeroTelefono.trim() && !/^[0-9]{10}$/.test(form.numeroTelefono.trim())) {
      setFormError('El teléfono debe contener exactamente 10 dígitos.');
      return;
    }

    if (form.codigoPostal.trim() && !/^[0-9]{5}$/.test(form.codigoPostal.trim())) {
      setFormError('El código postal debe contener exactamente 5 dígitos.');
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
        setToast({mensaje: 'Docente actualizado correctamente.', tipo: 'exito',});
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
        setToast({mensaje: 'Docente creado exitosamente.', tipo: 'exito',});
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
      setToast({mensaje: 'Docente desactivado correctamente.',tipo: 'exito',});
    } catch {
      setToast({mensaje: 'No se pudo desactivar el docente.',
  tipo: 'error',});
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

      setToast({mensaje: 'Docente reactivado correctamente.',tipo: 'exito',});
    } catch {
      setToast({mensaje: 'No se pudo reactivar el docente',
  tipo: 'error',});
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
  <article
    className="modal show d-block"
    tabIndex={-1}
    role="presentation"
    onClick={() => setConfirmDeactivate(null)}
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
  >
    <article
      className="modal-dialog modal-dialog-centered"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dd-deactivate-title"
      onClick={(event) => event.stopPropagation()}
    >
      <article className="modal-content border-0 shadow rounded-4 overflow-hidden">

        <article className="modal-header text-white" style={{background: 'linear-gradient(135deg,var(--ar-profundo, var(--ar-azul))', }}>
          <article>
            <h5 className="modal-title fw-bold" id="dd-deactivate-title style={{''}}">
              Confirmar desactivación
            </h5>
            <p className="mb-0 small opacity-75">
              {getNombreCompleto(confirmDeactivate)}
            </p>
          </article>
        </article>

        <article className="modal-body py-4">
          <p className="mb-0">
            El docente <strong>{confirmDeactivate.nombre}</strong> de estar disponible para asignaciones,
            pero conservará su historial.
          </p>
        </article>

        <article className="modal-footer border-0 pt-0">
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
        </article>

      </article>
    </article>
  </article>,
  document.body,
)}


      {toast && createPortal(
        <Toast toast={toast} onCerrar={cerrarToast} />,
        document.body,
      )}
    </article>
  );
}


