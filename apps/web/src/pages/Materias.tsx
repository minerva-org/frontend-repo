import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import ModalMateria, { type DatosMateria } from '../components/ModalMateria.tsx';
import type { Materia } from '../types.ts';
import { apiClient } from '../services/ApiClient.ts';
import '../styles/Materias.css';

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
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

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
      const response = await apiClient.get<Materia[]>('/api/materias');

      setMaterias(response.data ?? []);
    } catch (err) {
      const message = extractErrorMessage(err, 'No se pudieron cargar las materias. Intenta recargar la página.');
      setMaterias([]);
      setError(message);
      setToast(message);
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
        normalizar(m.planEstudioId).includes(q),
    );
  }, [materias, busqueda]);

  async function handleGuardar(datos: DatosMateria) {
    try {
      if (modal?.tipo === 'editar') {
        const payload = {
          id: modal.materia.id,
          nombre: datos.nombre,
          prefijo: datos.prefijo,
          planEstudioId: null,
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

        const response = await apiClient.patch<Materia>(`/api/materias/${modal.materia.id}`, payload);

        setMaterias((prev) => prev.map((m) => (m.id === modal.materia.id ? response.data : m)));
        await loadMaterias();
        setModal(null);
        setToast('Materia guardada correctamente.');
        return;
      }

      const payload = {
        id: datos.id,
        nombre: datos.nombre,
        prefijo: datos.prefijo,
        planEstudioId: null,
        activo: true,
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
      setMaterias((prev) => [materiaResponse.data, ...prev]);
      await loadMaterias();
      setModal(null);
      setToast('Materia guardada correctamente.');
    } catch (err) {
      const message = extractErrorMessage(err, 'No se pudo guardar la materia.');
      setToast(message);
      setError(message);
    }
  }

  const [confirmDeactivate, setConfirmDeactivate] = useState<Materia | null>(null);

  async function cambiarEstado(materia: Materia, estado: boolean) {
  await apiClient.patch(`/api/materias/${materia.id}/estado`, null, {
    params: { estado },
  });
}

async function handleDeactivate(materia: Materia) {
  try {
    await cambiarEstado(materia, false);
    setConfirmDeactivate(null);
    setToast('Materia desactivada correctamente.');
    await loadMaterias();
  } catch (err) {
    const message = extractErrorMessage(err, 'No se pudo desactivar la materia.');
    setToast(message);
    setError(message);
  }
}

async function handleActivate(materia: Materia) {
  try {
    await cambiarEstado(materia, true);
    setToast('Materia reactivada correctamente.');
    await loadMaterias();
  } catch (err) {
    const message = extractErrorMessage(err, 'No se pudo reactivar la materia.');
    setToast(message);
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
            <i className="bi bi-list mat-icon"></i>
          </button>
          <span className="mat-topbar-title">Materias</span>
        </article>
        <article className="mat-topbar-side">
          <i className="bi bi-bell mat-icon"></i>
          <i className="bi bi-person-circle mat-icon"></i>
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
          <button className="mat-btn" type="button" onClick={() => setModal({ tipo: 'nueva' })}>
            <i className="bi bi-plus-lg"></i> Nueva materia
          </button>
        </section>

        <section className="mat-card">
          {error && <p className="mat-empty">{error}</p>}
          {cargando ? (
            <p className="mat-empty">Cargando materias...</p>
          ) : filtradas.length === 0 ? (
            <p className="mat-empty">
              {busqueda
                ? `No hay materias que coincidan con "${busqueda}".`
                : 'Aún no hay materias. Crea la primera con "Nueva materia".'}
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
                            <i className="bi bi-folder2-open"></i> {m.planEstudioId}
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
                              <button
                                className="mat-link mat-link-desactivar"
                                type="button"
                                onClick={() => abrirConfirmacionEliminacion(m)}
                              >
                                Eliminar
                              </button>
                            ) : (
                              <button
                                className="mat-link mat-link-reactivar"
                                type="button"
                                onClick={() => void handleActivate(m)}
                              >
                                Reactivar
                              </button>
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
          className="mat-modal-overlay"
          onClick={() => setConfirmDeactivate(null)}
        >
          <article
            className="mat-modal"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mat-modal-header">
              Confirmar desactivación
            </header>

            <section className="mat-modal-body">
              <p>¿Deseas desactivar el registro "{confirmDeactivate.nombre}"?</p>
              <p>
                Dejará de estar disponible para asignarse.
              </p>
            </section>

            <footer className="mat-modal-actions">
              <button
                type="button"
                onClick={() => setConfirmDeactivate(null)}
                className="mat-btn mat-btn-secondary"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void handleDeactivate(confirmDeactivate)}
                className="mat-btn mat-btn-primary"
              >
                Confirmar
              </button>
            </footer>
          </article>
        </article>,
        document.body,
      )}

      {toast && createPortal(
        <article
          style={{
            position: 'fixed',
            right: '1.25rem',
            bottom: '1.25rem',
            zIndex: 2000,
            background: '#111827',
            color: '#fff',
            padding: '0.8rem 1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontSize: '0.95rem',
            maxWidth: '30rem',
          }}
        >
          {toast}
        </article>,
        document.body,
      )}

     
    </article>
  );
}

