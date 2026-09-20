import { useState } from 'react';
import '../styles/CatalogoGrupos.css';

interface Group {
  code: string;
  subject: string;
  teacher: string | null;
  students: number;
  status: 'activo' | 'sin_docente' | 'archivado';
  atRisk: number;
}

const MOCK_GROUPS: Group[] = [
  {
    code: 'MAT3-A',
    subject: 'Matemáticas III — Grupo A',
    teacher: 'Prof. García',
    students: 36,
    status: 'activo',
    atRisk: 1,
  },
  {
    code: 'FIS2-B',
    subject: 'Física II — Grupo B',
    teacher: 'Prof. Ruiz',
    students: 28,
    status: 'activo',
    atRisk: 0,
  },
  {
    code: 'PROG1-A',
    subject: 'Programación I — Grupo A',
    teacher: null,
    students: 30,
    status: 'sin_docente',
    atRisk: 0,
  },
];

type FilterKey = 'todos' | 'alertas' | 'sin_docente' | 'archivados';

export default function GroupsCatalog() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('todos');

  const filtered = MOCK_GROUPS.filter((group) => {
    const matchesSearch =
      group.code.toLowerCase().includes(search.toLowerCase()) ||
      group.subject.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'alertas') return group.atRisk > 0;
    if (filter === 'sin_docente') return group.status === 'sin_docente';
    if (filter === 'archivados') return group.status === 'archivado';
    return true;
  });

  const counts = {
    todos: MOCK_GROUPS.length,
    alertas: MOCK_GROUPS.filter((g) => g.atRisk > 0).length,
    sin_docente: MOCK_GROUPS.filter((g) => g.status === 'sin_docente').length,
    archivados: MOCK_GROUPS.filter((g) => g.status === 'archivado').length,
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
            <h1 className="groups-title">Grupos</h1>
            <p className="groups-subtitle">
              Ciclo Activo 2026-B · {MOCK_GROUPS.length} grupos ·{' '}
              {counts.alertas} con alertas
            </p>
          </article>
          <button className="groups-new-button">
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
            >
              Todos <span className="groups-pill-count">{counts.todos}</span>
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
            <article className="group-card" key={group.code}>
              <article className="group-card-top">
                <span className="group-card-code">{group.code}</span>
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

              <h3 className="group-card-subject">{group.subject}</h3>

              <hr className="group-card-divider" />

              <article className="group-card-footer">
                <article className="group-card-info">
                  {group.teacher ? (
                    <span className="group-card-teacher">
                      <i className="bi bi-person"></i> {group.teacher}
                    </span>
                  ) : (
                    <span className="group-card-warning">
                      <i className="bi bi-exclamation-triangle"></i> Sin
                      docente asignado
                    </span>
                  )}

                  <article className="group-card-bottom-row">
                    <span className="group-card-students">
                      <i className="bi bi-people"></i> {group.students} alumnos
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
    </article>
  );
}