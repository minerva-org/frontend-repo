import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';

interface Plantel {
  id: number;
  nombre: string;
  direccion: string;
  activo: boolean;
}

interface PlantelForm {
  nombre: string;
  direccion: string;
}

const BASE_INSTITUCION_ID = 1;
const emptyForm: PlantelForm = {
  nombre: '',
  direccion: '',
};

export default function Planteles() {
  const { toggleSidebar } = useSidebar();
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlantelForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmDeactivate, setConfirmDeactivate] = useState<Plantel | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadPlanteles() {
    try {
      const response = await apiClient.get<Plantel[]>('/api/planteles');
      setPlanteles(response.data ?? []);
      setFetchError(null);
    } catch {
      setPlanteles([]);
      setFetchError('No se pudieron cargar los planteles. Revisa sesión, token y permisos del backend.');
    }
  }

  useEffect(() => {
    void loadPlanteles();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(plantel: Plantel) {
    setEditingId(plantel.id);
    setForm({
      nombre: plantel.nombre,
      direccion: plantel.direccion,
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

    if (!form.nombre.trim() || !form.direccion.trim()) {
      setFormError('Completa nombre y dirección del plantel.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const response = await apiClient.patch<Plantel>(`/api/planteles/${editingId}`, {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
        });
        const updated = response.data;
        setPlanteles((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setToast('Plantel actualizado correctamente.');
      } else {
        const response = await apiClient.post<Plantel>('/api/planteles', {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          institucionId: BASE_INSTITUCION_ID,
          activo: true,
        });
        const created = response.data;
        setPlanteles((prev) => [created, ...prev]);
        setToast('Plantel creado correctamente.');
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el plantel.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(plantel: Plantel) {
    setLoading(true);
    try {
      const response = await apiClient.patch<Plantel>(`/api/planteles/${plantel.id}`, {
        activo: false,
      });
      const updated = response.data;
      setPlanteles((prev) => prev.map((item) => (item.id === plantel.id ? updated : item)));
      setConfirmDeactivate(null);
      setToast('Plantel desactivado correctamente.');
    } catch {
      setToast('No se pudo desactivar el plantel.');
    } finally {
      setLoading(false);
    }
  }

  const filteredPlanteles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return planteles;
    return planteles.filter((plantel) =>
      plantel.nombre.toLowerCase().includes(query) || plantel.direccion.toLowerCase().includes(query),
    );
  }, [planteles, search]);

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
        <h1 style={{ margin: 0 }}>Planteles</h1>
      </header>

      <section style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar plantel por nombre o dirección..."
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
          + Agregar Plantel
        </button>
      </section>

      <section style={{ background: 'var(--seige-superficie)', border: '1px solid var(--seige-borde)', borderRadius: 16, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Planteles registrados</h2>

        {fetchError && <p style={{ color: 'var(--seige-error-texto)', marginBottom: 12 }}>{fetchError}</p>}

        {filteredPlanteles.length === 0 && !fetchError ? (
          <p>No hay planteles registrados aún.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--seige-borde)' }}>
                <th style={{ padding: '10px 8px' }}>Nombre</th>
                <th style={{ padding: '10px 8px' }}>Dirección</th>
                <th style={{ padding: '10px 8px' }}>Estado</th>
                <th style={{ padding: '10px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlanteles.map((plantel) => (
                <tr key={plantel.id} style={{ borderBottom: '1px solid color-mix(in srgb, var(--seige-borde) 70%, white)' }}>
                  <td style={{ padding: '10px 8px' }}>{plantel.nombre}</td>
                  <td style={{ padding: '10px 8px' }}>{plantel.direccion}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: plantel.activo
                          ? 'color-mix(in srgb, var(--seige-exito) 20%, white)'
                          : 'var(--seige-error-fondo)',
                        color: plantel.activo
                          ? 'color-mix(in srgb, var(--seige-exito) 78%, black)'
                          : 'var(--seige-error-texto)',
                        fontWeight: 700,
                      }}
                    >
                      {plantel.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(plantel)}
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
                      disabled={!plantel.activo || loading}
                      onClick={() => setConfirmDeactivate(plantel)}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        background: plantel.activo
                          ? 'color-mix(in srgb, var(--seige-error-texto) 78%, white)'
                          : 'color-mix(in srgb, var(--ar-neblina) 70%, white)',
                        color: 'var(--seige-superficie)',
                        padding: '6px 10px',
                        cursor: plantel.activo ? 'pointer' : 'not-allowed',
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
              {editingId ? 'Editar Plantel' : 'Nuevo Plantel'}
            </header>
            <form onSubmit={handleSubmit} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Nombre completo del plantel</span>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid var(--seige-borde)' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Dirección</span>
                <input
                  value={form.direccion}
                  onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid var(--seige-borde)' }}
                />
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
              <p>¿Deseas desactivar el registro "{confirmDeactivate.nombre}"?</p>
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
