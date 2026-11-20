import { useCallback,useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import SidebarToggleIcon from '../components/common/SidebarToggleIcon.tsx';
import ModalMateria, { type DatosMateria } from '../components/modals/ModalMateria.tsx';
import type { Materia } from '../types/types.ts';
import { apiClient } from '../services/ApiClient.ts';
import '../styles/Materias.css';
import { useAuth } from '../context/AuthContext.tsx';
import { deleteArchivoTemporal, uploadArchivoTemporal } from '../services/materiaDocumentoService.ts';
import Toast, {type ToastData}  from '../components/common/Toast.tsx'
import { nombreVisibleMateria, puedeCambiarEstadoMateria } from '../utils/materiaPermisos.ts';

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

type EstadoModal = { tipo: 'nueva' } | { tipo: 'editar'; materia: Materia } | null;

type MateriaListado = Materia;

export default function Materias() {
  const { toggleSidebar } = useSidebar();
  const [materias, setMaterias] = useState<MateriaListado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<EstadoModal>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastData | null>(null);
  const cerrarToast = useCallback(() => { setToast(null);}, []);
  const { role, selectedPlantel } = useAuth();


  function extractErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err !== null) {
      const maybeResponse = 'response' in err ? (err as { response?: { data?: { mensaje?: string; message?: string } } }).response : undefined;
      const backendMessage = maybeResponse?.data?.mensaje ?? maybeResponse?.data?.message;
      if (backendMessage) return String(backendMessage);

      const maybeMessage = 'message' in err ? (err as { message?: string }).message : undefined;
      if (maybeMessage) return String(maybeMessage);
    }

    return fallback;
  }

  async function loadMaterias() {
    setCargando(true);
    setError('');

    try {
      const plantelId = role === 'directorPlantel' || role === 'coordinador' || role === 'directorGeneral'
        ? selectedPlantel?.id ?? null
        : null;
      const response = await apiClient.get<Materia[]>(
        plantelId != null
          ? `/api/materias?plantelId=${encodeURIComponent(plantelId)}`
          : '/api/materias',
      );

      setMaterias(response.data ?? []);
    } catch (err) {
      const message = extractErrorMessage(err, 'No se pudieron cargar las materias. Intenta recargar la página.');
      setMaterias([]);
      setError(message);
      setToast({ mensaje: message, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void loadMaterias();
  }, []);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return materias;
    return materias.filter(
      (m) =>
        normalizar(m.id).includes(q) ||
        normalizar(m.nombre).includes(q) ||
        normalizar(m.prefijo).includes(q) ||
        normalizar(nombreVisibleMateria(m)).includes(q),
    );
  }, [materias, busqueda]);

  async function handleGuardar(datos: DatosMateria) {
    let documentoTemporalId: string | null = null;
    let materiaPersistida = false;

    try {
      let documentoMateriaId: string | null = null;
      if (datos.archivo) {
        const archivoSubido = await uploadArchivoTemporal(datos.archivo);
        documentoMateriaId = archivoSubido.fileId;
        documentoTemporalId = archivoSubido.fileId;
      }

      if (modal?.tipo === 'editar') {
        const payload = {
          id: modal.materia.id,
          nombre: datos.nombre,
          prefijo: datos.prefijo,
          planEstudioId: null,
          documentoMateriaId,
          plantelId: role === 'directorPlantel' || role === 'coordinador'
            ? selectedPlantel?.id ?? null
            : modal.materia.plantelId ?? null,
          unidades: (datos.unidades ?? []).map((unidad) => ({
            id: unidad.id,
            nombre: unidad.nombre.trim(),
            temas: (unidad.temas ?? []).map((tema) => ({
              id: tema.id,
              nombre: tema.nombre.trim(),
              conceptos: (tema.conceptos ?? []).map((concepto) => ({
                id: concepto.id,
                nombre: concepto.nombre.trim(),
              })),
            })),
          })),
        };

        const plantelQuery = role === 'directorPlantel' || role === 'coordinador'
          ? `?plantelId=${encodeURIComponent(selectedPlantel?.id ?? '')}`
          : '';
        const response = await apiClient.patch<Materia>(
          `/api/materias/${modal.materia.id}${plantelQuery}`,
          payload,
        );
        materiaPersistida = true;
        setMaterias((prev) => prev.map((m) => (m.id === modal.materia.id ? response.data : m)));
        await loadMaterias();
        setModal(null);
        setToast({
          mensaje:'Materia guardada correctamente.',
          tipo:'exito'});
        return;
      }

      const payload = {
        id: datos.id,
        nombre: datos.nombre,
        prefijo: datos.prefijo,
        planEstudioId: null,
        documentoMateriaId,
        plantelId: role === 'directorPlantel' || role === 'coordinador'
          ? selectedPlantel?.id ?? null
          : null,
        unidades: (datos.unidades ?? []).map((unidad) => ({
          id: unidad.id,
          nombre: unidad.nombre.trim(),
          temas: (unidad.temas ?? []).map((tema) => ({
            id: tema.id,
            nombre: tema.nombre.trim(),
            conceptos: (tema.conceptos ?? []).map((concepto) => ({
              id: concepto.id,
              nombre: concepto.nombre.trim(),
            })),
          })),
        })),
      };

      const materiaResponse = await apiClient.post<Materia>('/api/materias', payload);
      materiaPersistida = true;
      setMaterias((prev) => [materiaResponse.data, ...prev]);
      await loadMaterias();
      setModal(null);
      setToast({
        mensaje:'Materia guardada correctamente.',
        tipo:'exito'});
    } catch (err) {
      if (documentoTemporalId && !materiaPersistida) {
        try {
          await deleteArchivoTemporal(documentoTemporalId);
        } catch {
          // La limpieza será segura en el backend si el archivo ya quedó asociado.
        }
      }
      const message = extractErrorMessage(err, 'No se pudo guardar la materia.');
      setToast({
        mensaje:message,
        tipo:'error'});
      setError(message);
      throw err;
    }
  }

  const [confirmDeactivate, setConfirmDeactivate] = useState<Materia | null>(null);

  async function handleDeactivate(materia: Materia) {
    try {
      const plantelQuery = role === 'directorPlantel' || role === 'coordinador'
        ? `?plantelId=${encodeURIComponent(selectedPlantel?.id ?? '')}`
        : '';
      const response = await apiClient.patch<Materia>(
        `/api/materias/${materia.id}${plantelQuery}`,
        { activo: false },
      );

      setMaterias((prev) =>
        prev.map((item) =>
          item.id === materia.id
            ? { ...item, ...response.data, activo: false }
            : item,
        ),
      );

      setConfirmDeactivate(null);
      setToast({
        mensaje:'Materia desactivada correctamente.',
        tipo:'exito'});
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo desactivar la materia.'));
    }
  }

  async function handleActivate(materia: Materia) {
    try {
      const plantelQuery = role === 'directorPlantel' || role === 'coordinador'
        ? `?plantelId=${encodeURIComponent(selectedPlantel?.id ?? '')}`
        : '';
      await apiClient.patch(`/api/materias/${materia.id}${plantelQuery}`, {
        activo: true,
      });

      setConfirmDeactivate(null);
      setToast({
        mensaje:'Materia reactivada correctamente.',
        tipo:'exito'});

      await loadMaterias();
    } catch (err) {
      const message = extractErrorMessage(err, 'No se pudo reactivar la materia.');
      setToast({
         mensaje:message,
          tipo:'error'});
      setError(message);
    }
  }

  function abrirConfirmacionEliminacion(materia: Materia) {
    setConfirmDeactivate(materia);
  }

  return (
    <article className="mat-screen">
      <header className="mat-topbar">
        <article className="mat-topbar-side">
          <button className="mat-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <SidebarToggleIcon className="mat-icon" />
          </button>
          <span className="mat-topbar-title">Materias</span>
        </article>
        <article className="mat-topbar-side">
        </article>
      </header>


      <main className="mat-content">
        <section className="mat-hero">
          <article className="mat-hero-top">
            <article>
              <h1 className="mat-hero-title">Catálogo de materias</h1>
              <p className="mat-hero-subtitle">
                Registro y mantenimiento de materias, prefijos y planes de estudio.
              </p>
            </article>
          </article>
        </section>


        <section className="mat-toolbar">
          <article className="mat-search-row">
            <i className="bi bi-search mat-search-icon"></i>
            <input
              className="mat-search-input"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar materia..."
              aria-label="Buscar materias"
            />
          </article>
          {(role === 'directorPlantel' ||  role === 'directorGeneral') && (
            <button className="mat-btn" type="button" onClick={() => setModal({ tipo: 'nueva' })}>
              <i className="bi bi-plus-lg"></i> Nueva materia
            </button>
          )}
        </section>

        <section className="mat-card">
          {error && <p className="mat-empty">{error}</p>}
          {cargando ? (
            <p className="mat-empty">Cargando materias...</p>
          ) : filtradas.length === 0 ? (
            <p className="mat-empty">
              {busqueda
                ? `No hay materias que coincidan con "${busqueda}".`
                : 'Aún no hay materias.'}
            </p>
          ) : (
            <article className="mat-table-wrap">
              <table className="mat-table">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Prefijo</th>
                    <th scope="col">Plan de estudio</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((m) => {
                    const estaActiva = m.activo !== false;
                    const puedeCambiarEstado = puedeCambiarEstadoMateria(role, m);

                    return (
                      <tr
                        key={m.id}
                        className={!estaActiva ? 'mat-row-inactiva' : ''}
                      >
                        <td className="mat-td-nombre">
                          {m.nombre}
                          {!estaActiva && (
                            <span className="mat-estado-inactivo">Inactiva</span>
                          )}
                        </td>

                        <td>
                          <span className="mat-plan">{m.prefijo}</span>
                        </td>

                        <td>
                          <span className="mat-plan">
                            <i className="bi bi-folder2-open"></i>{' '}
                            {nombreVisibleMateria(m)}
                          </span>
                        </td>

                        <td>
                          <article className="mat-actions">
                            <button
                              className="mat-link mat-link-editar"
                              type="button"
                              disabled={!estaActiva}
                              onClick={() => setModal({ tipo: 'editar', materia: m })}
                            >
                              <i className="bi bi-pencil"></i> Editar
                            </button>

                            {estaActiva ? (
                              puedeCambiarEstado ? (
                                <button
                                  className="mat-link mat-link-desactivar"
                                  type="button"
                                  onClick={() => abrirConfirmacionEliminacion(m)}
                                >
                                  Eliminar
                                </button>
                              ) : null
                            ) : (
                              puedeCambiarEstado ? (
                                <button
                                  className="mat-link mat-link-reactivar"
                                  type="button"
                                  onClick={() => void handleActivate(m)}
                                >
                                  Reactivar
                                </button>
                              ) : null
                            )}
                          </article>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>
          )}
        </section>
      </main>

      {modal && (
        <ModalMateria
          key={modal.tipo === 'editar' ? modal.materia.id : 'nueva'}
          materia={modal.tipo === 'editar' ? modal.materia : null}
          onCerrar={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}

      
  {confirmDeactivate && createPortal(
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
        aria-labelledby="mat-deactivate-title"
        onClick={(event) => event.stopPropagation()}
      >
        <article className="modal-content border-0 shadow rounded-4 overflow-hidden">

          <header
            className="modal-header text-white"
            style={{
              background: 'linear-gradient(135deg, var(--ar-profundo), var(--ar-azul))',
            }}
          >
            <h5
              className="modal-title fw-bold text-white"
              id="mat-deactivate-title"
            >
              Confirmar desactivación
            </h5>
          </header>

          <section className="modal-body py-4">
            <p className="mb-2">
              ¿Deseas desactivar el registro <strong>{confirmDeactivate.nombre}</strong>?
            </p>
            <p className="mb-0">
              Dejará de estar disponible para asignarse.
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


  <Toast toast={toast} onCerrar={cerrarToast}/>

     
    </article>
  );
}

