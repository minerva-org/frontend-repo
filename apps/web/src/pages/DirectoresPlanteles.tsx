import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import { createPersona, updatePersona } from '../services/personaService';

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

interface DirectorFormState {
  nombreCompleto: string;
  email: string;
  plantelId: number;
}

const emptyForm: DirectorFormState = {
  nombreCompleto: '',
  email: '',
  plantelId: 1,
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

  const [confirmDeactivate, setConfirmDeactivate] = useState<DirectorPersona | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadDirectores() {
    try {
      const response = await apiClient.get<DirectorPersona[]>('/api/personas?rol=DIRECTOR_PLANTEL');
      setDirectores(response.data ?? []);
      setFetchError(null);
    } catch {
      setDirectores([]);
      setFetchError('No se pudieron cargar los directores. Revisa sesión, token y permisos del backend.');
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

  function getNombreCompleto(director: DirectorPersona) {
    return `${director.nombre} ${director.apellido}`.trim();
  }

  function getPlantelNombre(plantelId: number) {
    const found = planteles.find((item) => item.id === plantelId);
    return found?.nombre ?? `Plantel ${plantelId}`;
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      plantelId: planteles[0]?.id ?? 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(director: DirectorPersona) {
    setEditingId(director.id);
    setForm({
      nombreCompleto: getNombreCompleto(director),
      email: director.email,
      plantelId: director.plantelId,
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

    setLoading(true);
    try {
      const plantelId = Number(form.plantelId) || planteles[0]?.id || 1;

      if (editingId) {
        const response = await updatePersona(editingId, {
          nombre,
          apellido,
          email: form.email.trim(),
          plantelId,
          rol: 'DIRECTOR_PLANTEL',
        });
        const updated = response.data as DirectorPersona;
        setDirectores((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setToast('Director actualizado correctamente.');
      } else {
        const response = await createPersona({
          id: crypto.randomUUID(),
          nombre,
          apellido,
          email: form.email.trim(),
          rol: 'DIRECTOR_PLANTEL',
          activo: true,
          plantelId,
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
    <article style={{ padding: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Mostrar u ocultar menú"
          style={{ border: 'none', background: 'color-mix(in srgb, var(--ar-neblina) 26%, white)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}
        >
          <i className="bi bi-list" />
        </button>
        <h1 style={{ margin: 0 }}>Directores de Plantel</h1>
      </header>

      <section style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en directores de plantel..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: '1px solid var(--seige-borde)',
            background: 'color-mix(in srgb, var(--ar-neblina) 12%, white)',
          }}
        />
        <button
          type="button"
          onClick={openCreateModal}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            background: 'var(--seige-acento)',
            color: 'var(--seige-superficie)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Agregar Director
        </button>
      </section>

      <section style={{ background: 'var(--seige-superficie)', border: '1px solid var(--seige-borde)', borderRadius: 16, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Directores de Plantel Escolar</h2>

        {fetchError && <p style={{ color: 'var(--seige-error-texto)', marginBottom: 12 }}>{fetchError}</p>}

        {filteredDirectores.length === 0 && !fetchError ? (
          <p>No hay directores creados aún.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--seige-borde)' }}>
                <th style={{ padding: '10px 8px' }}>Nombre del director</th>
                <th style={{ padding: '10px 8px' }}>Correo institucional</th>
                <th style={{ padding: '10px 8px' }}>Plantel asignado</th>
                <th style={{ padding: '10px 8px' }}>Estado</th>
                <th style={{ padding: '10px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDirectores.map((director) => (
                <tr key={director.id} style={{ borderBottom: '1px solid color-mix(in srgb, var(--seige-borde) 70%, white)' }}>
                  <td style={{ padding: '10px 8px' }}>{getNombreCompleto(director)}</td>
                  <td style={{ padding: '10px 8px' }}>{director.email}</td>
                  <td style={{ padding: '10px 8px' }}>{getPlantelNombre(director.plantelId)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: director.activo
                          ? 'color-mix(in srgb, var(--seige-exito) 20%, white)'
                          : 'var(--seige-error-fondo)',
                        color: director.activo
                          ? 'color-mix(in srgb, var(--seige-exito) 78%, black)'
                          : 'var(--seige-error-texto)',
                        fontWeight: 700,
                      }}
                    >
                      {director.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(director)}
                      style={{
                        border: '1px solid var(--seige-borde)',
                        borderRadius: 8,
                        background: 'var(--seige-superficie)',
                        padding: '6px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={!director.activo || loading}
                      onClick={() => setConfirmDeactivate(director)}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        background: director.activo
                          ? 'color-mix(in srgb, var(--seige-error-texto) 78%, white)'
                          : 'color-mix(in srgb, var(--ar-neblina) 70%, white)',
                        color: 'var(--seige-superficie)',
                        padding: '6px 10px',
                        cursor: director.activo ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && createPortal(
        <article style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'grid', placeItems: 'center', zIndex: 40 }}>
          <article style={{ background: 'var(--seige-superficie)', borderRadius: 14, width: 'min(560px, 92vw)', overflow: 'hidden' }}>
            <header style={{ background: 'color-mix(in srgb, var(--ar-azul) 82%, white)', color: 'var(--seige-superficie)', padding: '14px 16px', fontWeight: 700 }}>
              {editingId ? 'Editar Director de Plantel' : 'Nuevo Director de Plantel'}
            </header>
            <form onSubmit={handleSubmit} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Nombre completo</span>
                <input
                  value={form.nombreCompleto}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid var(--seige-borde)' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Correo electrónico oficial</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid var(--seige-borde)' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Plantel de adscripción</span>
                <select
                  value={form.plantelId}
                  onChange={(e) => setForm((prev) => ({ ...prev, plantelId: Number(e.target.value || 1) }))}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid var(--seige-borde)' }}
                >
                  {planteles.map((plantel) => (
                    <option key={plantel.id} value={plantel.id}>{plantel.nombre}</option>
                  ))}
                </select>
              </label>

              {formError && <p style={{ margin: 0, color: 'var(--seige-error-texto)' }}>{formError}</p>}

              <footer style={{ borderTop: '1px solid var(--seige-borde)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '9px 14px', border: '1px solid var(--seige-borde)', borderRadius: 8, background: 'var(--seige-superficie)', color: 'var(--seige-texto)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: 'var(--seige-acento)', color: 'var(--seige-superficie)', cursor: 'pointer' }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </footer>
            </form>
          </article>
        </article>,
        document.body,
      )}

      {confirmDeactivate && createPortal(
        <article style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <article style={{ background: 'var(--seige-superficie)', borderRadius: 14, width: 'min(520px, 92vw)', overflow: 'hidden' }}>
            <header style={{ background: 'color-mix(in srgb, var(--seige-error-texto) 88%, white)', color: 'var(--seige-superficie)', padding: '14px 16px', fontWeight: 700 }}>
              Confirmar
            </header>
            <section style={{ padding: 16, color: 'var(--seige-texto-secundario)' }}>
              <p>¿Deseas desactivar el registro "{getNombreCompleto(confirmDeactivate)}"?</p>
              <p style={{ marginBottom: 0 }}>No se elimina ni su historial, solo deja de estar disponible para asignarse.</p>
            </section>
            <footer style={{ borderTop: '1px solid var(--seige-borde)', padding: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmDeactivate(null)}
                style={{ padding: '9px 14px', border: '1px solid var(--seige-borde)', borderRadius: 8, background: 'var(--seige-superficie)', color: 'var(--seige-texto)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDeactivate(confirmDeactivate)}
                style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: 'color-mix(in srgb, var(--seige-error-texto) 88%, white)', color: 'var(--seige-superficie)', cursor: 'pointer' }}
              >
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
