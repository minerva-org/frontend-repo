import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import CreateGroupModal, { type NewGroupData } from '../components/ModalGrupos.tsx';
import GroupActionsMenu from '../components/grupos/GroupActionsMenu.tsx';
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
  alumnosIds?: string[];
}

interface GrupoListado extends GrupoBackend {
  docenteNombre: string;
  docenteEmail: string;
  alumnosCount: number;
}

export default function Grupos({ soloMisGrupos = false }: GruposProps) {
  const [groups, setGroups] = useState<GrupoListado[]>([]);
  const [personas, setPersonas] = useState<PersonaRecord[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, email, user, selectedPlantel, setSelectedPlantel } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);
  const [pendingArchiveGroup, setPendingArchiveGroup] = useState<GrupoListado | null>(null);
  const [createdGroupName, setCreatedGroupName] = useState<string | null>(null);
  const [createGroupError, setCreateGroupError] = useState(false);

  const urlPlantelId = Number(searchParams.get('plantelId')) || null;
  const activePlantelId = urlPlantelId ?? selectedPlantel?.id ?? null;

  console.log({
    urlPlantelId,
    selectedPlantel,
    activePlantelId,
  });

  const propiaPersona = useMemo(
    () => personas.find((p) => (p.email ?? '').toLowerCase() === (email ?? '').toLowerCase()),
    [personas, email],
  );

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

      const personasData = personasResponse.data ?? [] as PersonaRecord[];
      setPersonas(personasData);
      const personaMap = new Map<string, PersonaRecord>(personasData.map((persona) => [persona.id, persona]));

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
      setFetchError('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, [activePlantelId]);

  const normalizedRole = String(role ?? '').toLowerCase();

  const relatedGroups = useMemo(() => {
    return groups.filter((group) => {
      if (activePlantelId != null && group.plantelId != null) {
        if (group.plantelId !== activePlantelId) return false;
      }

      if (normalizedRole === 'alumno') {
        return Boolean(user?.id && group.alumnosIds?.includes(user.id));
      }

      if (['directorgeneral', 'directorplantel', 'admin', 'dev'].includes(normalizedRole)) {
        return true;
      }

      const esMiGrupo =
        group.docenteEmail.toLowerCase() === (email ?? '').toLowerCase() ||
        (!!propiaPersona && group.docenteId === propiaPersona.id);

      if (soloMisGrupos || normalizedRole === 'docente') return esMiGrupo;
      if (normalizedRole === 'coordinador') return true;

      return false;
    });
  }, [
    groups,
    normalizedRole,
    email,
    user?.id,
    soloMisGrupos,
    activePlantelId,
    propiaPersona,
  ]);

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

  const handleCreateGroup = async (data: NewGroupData) => {
    setCreateGroupError(false);
    setCreatedGroupName(null);

    const plantelId = data.plantelId ?? selectedPlantel?.id;

    if (plantelId == null) {
      setCreateGroupError(true);
      setCreatedGroupName(data.materia);
      throw new Error('No hay un plantel seleccionado.');
    }

    const docente = personas.find((persona) => persona.id === data.docenteId);
    const alumnosInactivos = data.alumnosIds.filter((alumnoId) => {
      const alumno = personas.find((persona) => persona.id === alumnoId);
      return alumno?.activo === false;
    });

    if (docente?.activo === false || alumnosInactivos.length > 0) {
      setCreateGroupError(true);
      setCreatedGroupName(data.materia);
      throw new Error('No puedes agregar personas desactivadas al grupo.');
    }

    const payload = {
      id: crypto.randomUUID(),
      claveGrupo: data.claveGrupo,
      nombre: data.materia,
      semestre: data.grado,
      activo: true,
      docenteId: data.docenteId,
      plantelId,
      alumnosIds: data.alumnosIds,
    };

    try {
      const response = await apiClient.post('/api/grupos', payload);

      await loadGroups();
      setShowModal(false);
      setCreatedGroupName(data.materia);
      setCreateGroupError(false);

      return response.data;
    } catch (error: any) {
      console.error('Response data:', error?.response?.data);

      setShowModal(false);
      setCreateGroupError(true);
      setCreatedGroupName(data.materia);

      throw error;
    }
  };

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
          <article>
            <h1 className="groups-title">Catálogo de grupos</h1>
            <p className="groups-subtitle">Ciclo Activo 2026</p>
          </article>
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

          {normalizedRole !== 'alumno' && (
            <button
              className="groups-new-button"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-lg"></i>
              Nuevo grupo
            </button>
          )}
        </article>

        {fetchError && <p className="groups-empty">{fetchError}</p>}

        {loading ? (
          <p className="groups-empty">Cargando grupos...</p>
        ) : (
          <>
            {filtered.length === 0 ? (
              <p className="groups-empty">
                {soloMisGrupos || normalizedRole === 'docente'
                  ? 'Aún no tienes grupos asignados.'
                  : 'No se encontraron grupos activos.'}
              </p>
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
                            <GroupActionsMenu
                              group={group}
                              isOpen={openMenuGroupId === group.id}
                              onToggle={setOpenMenuGroupId}
                              onView={(groupId) => navigate(`/grupos/${groupId}`)}
                              onArchive={openArchiveModal}
                            />
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
                            <GroupActionsMenu
                              group={group}
                              isOpen={openMenuGroupId === group.id}
                              onToggle={setOpenMenuGroupId}
                              onView={(groupId) => navigate(`/grupos/${groupId}`)}
                              onReactivate={(groupId) => void toggleGroupActivo(groupId, true)}
                              archived
                            />
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
        <article className="groups-modal-backdrop" role="presentation" onClick={() => setPendingArchiveGroup(null)}>
          <article className="groups-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="archive-group-title" onClick={(event) => event.stopPropagation()}>
            <header className="groups-confirm-header">
              <article>
                <h3 id="archive-group-title" className="groups-confirm-title">Archivar grupo</h3>
                <p className="groups-confirm-subtitle">Confirmación requerida</p>
              </article>
            </header>

            <section className="groups-confirm-body">
              <p className="groups-confirm-text">
                ¿Deseas archivar el grupo <strong>{pendingArchiveGroup.nombre}</strong>?
                <br />
                Ya no aparecerá en este catálogo, pero podrás seguir entrando a su detalle desde la ruta directa si lo necesitas.
              </p>
            </section>

            <article className="groups-confirm-actions">
              <button type="button" className="groups-secondary-button" onClick={() => setPendingArchiveGroup(null)}>
                Cancelar
              </button>
              <button type="button" className="groups-confirm-button" onClick={() => void toggleGroupActivo(pendingArchiveGroup.id, false)}>
                <i className="bi bi-archive"></i> Archivar
              </button>
            </article>
          </article>
        </article>
      )}

      {createdGroupName && (
        <article
          className="groups-modal-backdrop"
          role="presentation"
          onClick={() => {
            setCreatedGroupName(null);
            setCreateGroupError(false);
          }}
        >
          <article
            className={`groups-confirm-modal ${
              createGroupError ? 'groups-confirm-modal-error' : ''
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="created-group-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="groups-confirm-header">
              <article>
                <h3 id="created-group-title" className="groups-confirm-title">
                  {createGroupError ? 'No se pudo crear el grupo' : 'Grupo creado'}
                </h3>
                <p className="groups-confirm-subtitle">
                  {createGroupError
                    ? 'Ocurrió un problema al guardar la información'
                    : 'La operación se realizó correctamente'}
                </p>
              </article>
            </header>

            <section className="groups-confirm-body">
              <p className="groups-confirm-text">
                {createGroupError ? (
                  <>
                    No se pudo crear el grupo <strong>{createdGroupName}</strong>.
                    Revisa los datos e inténtalo nuevamente.
                  </>
                ) : (
                  <>
                    El grupo <strong>{createdGroupName}</strong> fue creado correctamente.
                  </>
                )}
              </p>
            </section>

            <article className="groups-confirm-actions">
              <button
                type="button"
                className={`groups-confirm-button ${
                  createGroupError ? 'groups-confirm-button-error' : ''
                }`}
                onClick={() => {
                  setCreatedGroupName(null);
                  setCreateGroupError(false);
                }}
              >
                Aceptar
              </button>
            </article>
          </article>
        </article>
      )}
    </article>
  );
}
