import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import CreateGroupModal, { type NewGroupData } from '../components/ModalGrupos.tsx';
import { apiClient } from '../services/ApiClient';
import { fetchPersonas, type PersonaRecord } from '../services/personaService';
import '../styles/Grupos.css';

interface GruposProps {
  soloMisGrupos?: boolean;
}

interface GrupoBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  activo?: boolean;
  docenteId: string;
  plantelId: number | null;
}

interface GrupoListado extends GrupoBackend {
  docenteNombre: string;
  docenteEmail: string;
  alumnosCount: number;
}

export default function Grupos({ soloMisGrupos = false }: GruposProps) {
  const [groups, setGroups] = useState<GrupoListado[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, email, selectedPlantel, setSelectedPlantel } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);
  const [pendingArchiveGroup, setPendingArchiveGroup] = useState<GrupoListado | null>(null);

  const urlPlantelId = Number(searchParams.get('plantelId')) || null;
  const activePlantelId = urlPlantelId ?? selectedPlantel?.id ?? null;

  useEffect(() => {
    if (urlPlantelId && selectedPlantel?.id !== urlPlantelId) {
      setSelectedPlantel({ id: urlPlantelId, nombre: selectedPlantel?.nombre ?? `Plantel ${urlPlantelId}` });
    }
  }, [urlPlantelId, selectedPlantel, setSelectedPlantel]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.groups-action-menu')) {
        return;
      }
      setOpenMenuGroupId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  async function loadGroups() {
    setLoading(true);
    try {
      const [gruposResponse, personasResponse] = await Promise.all([
        activePlantelId != null
          ? apiClient.get<GrupoBackend[]>('/api/grupos', { params: { plantelId: activePlantelId } })
          : apiClient.get<GrupoBackend[]>('/api/grupos'),
        fetchPersonas(),
      ]);

      const personas = personasResponse.data ?? [] as PersonaRecord[];
      const personaMap = new Map<string, PersonaRecord>(personas.map((persona) => [persona.id, persona]));

      const grupos = gruposResponse.data ?? [];
      const alumnoCounts = await Promise.all(
        grupos.map(async (grupo) => {
          try {
            const alumnosResponse = await apiClient.get<string[]>(`/api/grupos/${grupo.id}/alumnos`);
            return [grupo.id, alumnosResponse.data?.length ?? 0] as const;
          } catch {
            return [grupo.id, 0] as const;
          }
        }),
      );

      const countMap = new Map<string, number>(alumnoCounts);

      setGroups(
        grupos.map((grupo) => {
          const persona = personaMap.get(grupo.docenteId);
          return {
            ...grupo,
            docenteNombre: persona ? `${persona.nombre} ${persona.apellido}`.trim() : grupo.docenteId,
            docenteEmail: persona?.email ?? grupo.docenteId,
            alumnosCount: countMap.get(grupo.id) ?? 0,
          };
        }),
      );
      setFetchError(null);
    } catch {
      setGroups([]);
      setFetchError('No se pudieron cargar los grupos desde el backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, [activePlantelId]);

  const relatedGroups = useMemo(() => {
    return groups.filter((group) => {
      if (activePlantelId != null && group.plantelId != null) {
        if (group.plantelId !== activePlantelId) return false;
      }

      if (role === 'directorGeneral' || role === 'directorPlantel' || role === 'admin' || role === 'dev') {
        return true;
      }

      if (soloMisGrupos) return group.docenteEmail.toLowerCase() === (email ?? '').toLowerCase();
      if (role === 'docente') return group.docenteEmail.toLowerCase() === (email ?? '').toLowerCase();
      if (role === 'coordinador') return true;
      return true;
    });
  }, [groups, role, email, soloMisGrupos, activePlantelId]);

  const visibleGroups = useMemo(
    () => relatedGroups.filter((group) => group.activo !== false),
    [relatedGroups],
  );

  const archivedGroups = useMemo(
    () => relatedGroups.filter((group) => group.activo === false),
    [relatedGroups],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return visibleGroups;

    return visibleGroups.filter((group) => {
      const haystack = [group.nombre, group.claveGrupo, group.semestre, group.docenteNombre, group.docenteId].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [visibleGroups, search]);

  const filteredArchived = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return archivedGroups;

    return archivedGroups.filter((group) => {
      const haystack = [group.nombre, group.claveGrupo, group.semestre, group.docenteNombre, group.docenteId].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [archivedGroups, search]);

  function openArchiveModal(group: GrupoListado) {
    setPendingArchiveGroup(group);
    setOpenMenuGroupId(null);
  }

  async function toggleGroupActivo(groupId: string, activo: boolean) {
    await apiClient.patch(`/api/grupos/${groupId}`, { activo });
    await loadGroups();
    setOpenMenuGroupId(null);
    setPendingArchiveGroup(null);
  }

  async function handleCreateGroup(data: NewGroupData) {
    if (!data.docenteId) {
      setFetchError('Selecciona un docente válido para crear el grupo.');
      return;
    }

    try {
      const materiaPrefix = data.materia
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => token.slice(0, 3))
        .join('')
        .slice(0, 6)
        .toUpperCase() || 'MAT';

      const cicloActivo = 'AGO-DIC-2026';
      const nombreGrupo = `${data.grupo} ${data.grado}`.replace(/\s+/g, ' ').trim();
      const claveGrupo = `${materiaPrefix}-${cicloActivo}-${nombreGrupo}`
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

      const payload = {
        id: crypto.randomUUID(),
        claveGrupo,
        nombre: `${data.grupo} — ${data.grado}`,
        semestre: cicloActivo,
        docenteId: data.docenteId,
        plantelId: data.plantelId ?? selectedPlantel?.id ?? null,
        materia: data.materia,
        alumnosIds: data.alumnosIds,
      };

      await apiClient.post('/api/grupos', payload);
      await loadGroups();
    } catch (error) {
      console.error('Error creando grupo:', error);
      setFetchError('No se pudo crear el grupo en el backend.');
    }
  }

  return (
    <article className="groups-screen">
      <header className="groups-topbar">
        <article className="groups-topbar-left">
          <button className="groups-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list groups-icon-button"></i>
          </button>
          <span className="groups-topbar-title">Grupos</span>
        </article>
      </header>

      <main className="groups-content">
        <article className="groups-header">
          <div>
            <h1 className="groups-title">Catálogo de grupos</h1>
            <p className="groups-subtitle">Ciclo Activo 2026</p>
          </div>
          <span className="groups-role-badge">ROL ACTIVO: {role ? role.toUpperCase() : '—'}</span>
        </article>

        <article className="groups-toolbar">
          <article className="groups-search-row">
            <i className="bi bi-search groups-search-icon"></i>
            <input
              className="groups-search-input"
              type="text"
              placeholder="Buscar por nombre, clave, docente o semestre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </article>

          <button className="groups-new-button" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg"></i>
            Nuevo grupo
          </button>
        </article>

        {fetchError && <p className="groups-empty">{fetchError}</p>}

        {loading ? (
          <p className="groups-empty">Cargando grupos...</p>
        ) : (
          <>
            {filtered.length === 0 ? (
              <p className="groups-empty">No se encontraron grupos activos.</p>
            ) : (
              <article className="groups-table-wrap">
                <table className="groups-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Clave</th>
                      <th>Semestre</th>
                      <th>Docente</th>
                      <th>Alumnos</th>
                      <th className="groups-th-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((group) => (
                      <tr key={group.id}>
                        <td className="groups-td-nombre" data-label="Nombre">{group.nombre}</td>
                        <td data-label="Clave">
                          <span className="groups-pill-code">{group.claveGrupo}</span>
                        </td>
                        <td data-label="Semestre">{group.semestre}</td>
                        <td data-label="Docente">{group.docenteNombre}</td>
                        <td data-label="Alumnos">{group.alumnosCount}</td>
                        <td data-label="Acciones">
                          <article className="groups-actions">
                            <div className="groups-action-menu">
                              <button
                                className="groups-link-button groups-menu-toggle"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenMenuGroupId((current) => (current === group.id ? null : group.id));
                                }}
                                aria-expanded={openMenuGroupId === group.id}
                                aria-label={`Opciones para ${group.nombre}`}
                              >
                                <i className="bi bi-list"></i> Opciones
                              </button>

                              {openMenuGroupId === group.id && (
                                <div
                                  className="groups-menu-panel"
                                  role="menu"
                                  aria-label={`Acciones para ${group.nombre}`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="groups-menu-item"
                                    onClick={() => {
                                      setOpenMenuGroupId(null);
                                      navigate(`/grupos/${group.id}`);
                                    }}
                                  >
                                    <i className="bi bi-eye"></i> Ver
                                  </button>
                                  <button
                                    type="button"
                                    className="groups-menu-item groups-menu-item-danger"
                                    onClick={() => openArchiveModal(group)}
                                  >
                                    <i className="bi bi-archive"></i> Archivar
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )}

            {filteredArchived.length > 0 && (
              <article className="groups-archived-section">
                <h2 className="groups-archived-title">Archivados</h2>
                <article className="groups-table-wrap groups-table-wrap-archived">
                  <table className="groups-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Clave</th>
                        <th>Semestre</th>
                        <th>Docente</th>
                        <th>Estado</th>
                        <th className="groups-th-actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArchived.map((group) => (
                        <tr key={group.id} className="groups-row-archived">
                          <td className="groups-td-nombre" data-label="Nombre">{group.nombre}</td>
                          <td data-label="Clave">
                            <span className="groups-pill-code groups-pill-code-archived">{group.claveGrupo}</span>
                          </td>
                          <td data-label="Semestre">{group.semestre}</td>
                          <td data-label="Docente">{group.docenteNombre}</td>
                          <td data-label="Estado">
                            <span className="groups-status-inactive">Inactivo</span>
                          </td>
                          <td data-label="Acciones">
                            <div className="groups-action-menu">
                              <button
                                className="groups-link-button groups-menu-toggle"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenMenuGroupId((current) => (current === group.id ? null : group.id));
                                }}
                                aria-expanded={openMenuGroupId === group.id}
                                aria-label={`Opciones para ${group.nombre}`}
                              >
                                <i className="bi bi-list"></i> Opciones
                              </button>

                              {openMenuGroupId === group.id && (
                                <div
                                  className="groups-menu-panel"
                                  role="menu"
                                  aria-label={`Acciones para ${group.nombre}`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="groups-menu-item"
                                    onClick={() => {
                                      setOpenMenuGroupId(null);
                                      navigate(`/grupos/${group.id}`);
                                    }}
                                  >
                                    <i className="bi bi-eye"></i> Ver
                                  </button>
                                  <button
                                    type="button"
                                    className="groups-menu-item"
                                    onClick={() => void toggleGroupActivo(group.id, true)}
                                  >
                                    <i className="bi bi-arrow-counterclockwise"></i> Reactivar
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              </article>
            )}
          </>
        )}
      </main>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {pendingArchiveGroup && (
        <div className="groups-modal-backdrop" role="presentation" onClick={() => setPendingArchiveGroup(null)}>
          <div className="groups-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="archive-group-title" onClick={(event) => event.stopPropagation()}>
            <header className="groups-confirm-header">
              <div>
                <h3 id="archive-group-title" className="groups-confirm-title">Archivar grupo</h3>
                <p className="groups-confirm-subtitle">Confirmación requerida</p>
              </div>
            </header>

            <section className="groups-confirm-body">
              <p className="groups-confirm-text">
                ¿Deseas archivar el grupo <strong>{pendingArchiveGroup.nombre}</strong>?
                <br />
                Ya no aparecerá en este catálogo, pero podrás seguir entrando a su detalle desde la ruta directa si lo necesitas.
              </p>
            </section>

            <div className="groups-confirm-actions">
              <button type="button" className="groups-secondary-button" onClick={() => setPendingArchiveGroup(null)}>
                Cancelar
              </button>
              <button type="button" className="groups-confirm-button" onClick={() => void toggleGroupActivo(pendingArchiveGroup.id, false)}>
                <i className="bi bi-archive"></i> Archivar
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}