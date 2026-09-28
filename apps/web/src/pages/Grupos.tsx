import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import CreateGroupModal, { type NewGroupData } from '../components/ModalGrupos';
import '../styles/Grupos.css';

interface Group {
  routeCode: string;
  grupo: string;
  docente: string | null;
  docenteEmail: string | null;
  coordinadoresEmail: string [];
  numeroEstudiantes: number;
  status: 'activo' | 'sin_docente' | 'archivado';
  atRisk: number;
  nextQuiz?: string;
}

const INITIAL_GROUPS: Group[] = [
  {
    routeCode: 'MAT3-A',
    grupo: 'Matemáticas III — Grupo A',
    docente: 'Prof. García',
    docenteEmail: 'docente@chapala.edu.mx',
    coordinadoresEmail: [],
    numeroEstudiantes: 36,
    status: 'activo',
    atRisk: 1,
  },
  {
    routeCode: 'FIS2-B',
    grupo: 'Física II — Grupo B',
    docente: 'Prof. Ruiz',
    docenteEmail: null, // el docente titular no tiene login mock propio
    coordinadoresEmail: ['coordinador@chapala.edu.mx'],
    numeroEstudiantes: 28,
    status: 'activo',
    atRisk: 0,
  },
  {
    routeCode: 'PROG1-A',
    grupo: 'Programación I — Grupo A',
    docente: null,
    docenteEmail: null,
    coordinadoresEmail: [],
    numeroEstudiantes: 30,
    status: 'sin_docente',
    atRisk: 0,
  },
];

type FilterKey = 'todos' | 'alertas' | 'sin_docente' | 'archivados';

function generaterouteCode(grupo: string, existing: Group[]): string {
  const prefix = grupo
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.slice(0, 3))
    .join('')
    .toUpperCase();
  let suffix = 1;
  let routecode = `${prefix}-${suffix}`;
  while (existing.some((g) => g.routeCode === routecode)) {
    suffix++;
    routecode = `${prefix}-${suffix}`;
  }
  return routecode;
}

export default function Grupos() {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const navigate = useNavigate();
  const {role, email} = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [showModal, setShowModal] = useState(false);

  const relatedGroups = groups.filter((g) => {
    if (role === 'docente') return g.docenteEmail === email;
    if (role === 'coordinador') return g.coordinadoresEmail.includes(email ?? '');
    return true;
  }) ;

  function handleCreateGroup(data: NewGroupData) {
    const newGroup: Group = {
      routeCode: generaterouteCode(data.grupo, groups),
      grupo: `${data.grupo} — ${data.grado}`,
      docente: data.docente,
      docenteEmail: role === 'docente' ? email :null,
      coordinadoresEmail: role === 'coordinador' && email ? [email] : [],
      numeroEstudiantes: data.numeroEstudiantes.length,
      status: data.docente ? 'activo' : 'sin_docente',
      atRisk: 0,
    };
    setGroups((prev) => [newGroup, ...prev]);
  }

  const filtered = relatedGroups.filter((group) => {
    const matchesSearch =
      group.routeCode.toLowerCase().includes(search.toLowerCase()) ||
      group.grupo.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'alertas') return group.atRisk > 0;
    if (filter === 'sin_docente') return group.status === 'sin_docente';
    if (filter === 'archivados') return group.status === 'archivado';
    return true;
  });

  const counts = {
    todos: relatedGroups.length,
    alertas: relatedGroups.filter((g) => g.atRisk > 0).length,
    sin_docente: relatedGroups.filter((g) => g.status === 'sin_docente').length,
    archivados: relatedGroups.filter((g) => g.status === 'archivado').length,
  };

  return (
    <article className="groups-screen">
      <header className="groups-topbar">
        <article className="groups-topbar-left">
          <i className="bi bi-list groups-icon-button"></i>
          <span className="groups-topbar-title">Grupos</span>
        </article>
        <article className="groups-topbar-right">
          <i className="bi bi-bell groups-icon-button"></i>
          <i className="bi bi-person-circle groups-icon-button"></i>
        </article>
      </header>

      <nav className="groups-breadcrumb">
        <span>Inicio</span>
        <span className="groups-breadcrumb-sep">/</span>
        <span className="groups-breadcrumb-current">Grupos</span>
      </nav>

      <main className="groups-content">
        <article className="groups-page-header">
          <article>
            <h1 className="groups-title">Catálogo de grupos</h1>
            <p className="groups-subtitle">
              Ciclo Activo 2026-B · {relatedGroups.length} grupos · {counts.alertas}{' '}
              con alertas
            </p>
          </article>
          <button className="groups-new-button" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg"></i>
            Nuevo grupo
          </button>
        </article>

        <article className="groups-search-row">
          <i className="bi bi-search groups-search-icon"></i>
          <input
            className="groups-search-input"
            type="text"
            placeholder="Buscar grupo o materia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </article>

        <article className="groups-filters">
          <button className="groups-filter-dropdown">
            Todos <i className="bi bi-chevron-down"></i>
          </button>
          <button className="groups-filter-dropdown">
            <i className="bi bi-funnel"></i> Filtros{' '}
            <span className="groups-filter-badge">2</span>
          </button>

          <article className="groups-filter-pills">

            <button
              className={`groups-pill ${filter === 'todos' ? 'active' : ''}`}
              onClick={() => setFilter('todos')}
            > Todos <span className="groups-pill-count">{counts.todos}</span>
            </button>

            <button
              className={`groups-pill ${filter === 'alertas' ? 'active' : ''}`}
              onClick={() => setFilter('alertas')}
            >
              Con alertas{' '}
              <span className="groups-pill-count">{counts.alertas}</span>
            </button>

            <button
              className={`groups-pill ${filter === 'sin_docente' ? 'active' : ''}`}
              onClick={() => setFilter('sin_docente')}
            >
              Sin docente{' '}
              <span className="groups-pill-count">{counts.sin_docente}</span>
            </button>

            <button
              className={`groups-pill ${filter === 'archivados' ? 'active' : ''}`}
              onClick={() => setFilter('archivados')}
            >
              Archivados{' '}
              <span className="groups-pill-count">{counts.archivados}</span>
            </button>
          </article>
        </article>

        <article className="groups-grid">
          {filtered.map((group) => (
            <article className="group-card" key={group.routeCode} onClick={() => navigate(`/grupos/${group.routeCode}`)} style={{cursor: 'pointer'}}>
              <article className="group-card-top">
                <span className="group-card-routecode">{group.routeCode}</span>
                {group.status === 'activo' && (
                  <span className="group-status group-status-activo">
                    <i className="bi bi-circle-fill"></i> Activo
                  </span>
                )}
                {group.status === 'sin_docente' && (
                  <span className="group-status group-status-alerta">
                    <i className="bi bi-circle-fill"></i> Sin docente
                  </span>
                )}
              </article>

              <h3 className="group-card-grupo">{group.grupo}</h3>

              <hr className="group-card-divider" />

              <article className="group-card-footer">
                <article className="group-card-info">
                  {group.docente ? (
                    <span className="group-card-docente">
                      <i className="bi bi-person"></i> {group.docente}
                    </span>
                  ) : (
                    <span className="group-card-warning">
                      <i className="bi bi-exclamation-triangle"></i> Sin
                      docente asignado
                    </span>
                  )}

                  <article className="group-card-bottom-row">
                    <span className="group-card-numeroEstudiantes">
                      <i className="bi bi-people"></i> {group.numeroEstudiantes} alumnos
                    </span>
                    {group.atRisk > 0 && (
                      <span className="group-card-risk">
                        <i className="bi bi-exclamation-triangle"></i>{' '}
                        {group.atRisk} en riesgo
                      </span>
                    )}
                  </article>
                </article>
                <i className="bi bi-three-dots group-card-menu"></i>
              </article>
            </article>
          ))}
        </article>

        {filtered.length === 0 && (
          <p className="groups-empty">No se encontraron grupos.</p>
        )}
      </main>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </article>
  );
}