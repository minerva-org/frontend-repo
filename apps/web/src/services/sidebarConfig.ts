import type { ContextSidebarConfig, SidebarConfig } from '../types/sidebarTypes.ts';

export const sidebarConfigByRole: Record<string, SidebarConfig> = {
  admin: {
    roleLabel: 'Administrador',
    navGroups: [
      {
        label: 'Administración',
        items: [
          { to: '/grupos', label: 'Grupos', icon: 'bi-collection' },
          { to: '/planteles', label: 'Planteles', icon: 'bi-building' },
          { to: '/directores-planteles', label: 'Directores', icon: 'bi-people' },
        ],
      },
    ],
  },

  dev: {
    roleLabel: 'Desarrollador',
    navGroups: [
      {
        label: 'Acceso Técnico',
        items: [
          { to: '/grupos', label: 'Grupos', icon: 'bi-collection' },
          { to: '/planteles', label: 'Planteles', icon: 'bi-building' },
          { to: '/directores-planteles', label: 'Directores', icon: 'bi-people' },
        ],
      },
    ],
  },

  directorGeneral: {
    roleLabel: 'Director General',
    navGroups: [
      {
        label: 'Supervisión Estratégica',
        items: [
          { to: '/metricas-tronco-comun', label: 'Métricas Generales', icon: 'bi-bar-chart-line' },
          { to: '/planteles', label: 'Planteles', icon: 'bi-building' },
          { to: '/directores-planteles', label: 'Directores', icon: 'bi-people' },
          { to: '/materias', label: 'Materias', icon: 'bi-journal-bookmark' },
        ],
      },
    ],
  },

  directorPlantel: {
    roleLabel: 'Director de Plantel',
    navGroups: [
      {
        label: 'Diagnóstico y Analítica',
        items: [{ to: '/metricas-tronco-comun', label: 'Métricas Plantel', icon: 'bi-graph-up', end: true }],
      },
      {
        label: 'Grupos Activos',
        items: [],
        dynamic: true,
      },
      {
        label: 'Gestión Académica',
        items: [
          { to: '/catalogo-grupos', label: 'Grupos', icon: 'bi-grid-3x3-gap' },
          { to: '/catalogo-docentes', label: 'Docentes', icon: 'bi-people' },
          { to: '/catalogo-alumnos', label: 'Alumnos', icon: 'bi-people' },
          { to: '/materias', label: 'Materias', icon: 'bi-journal-bookmark' },
        ],
      },
    ],
  },

  coordinador: {
    roleLabel: 'Coordinador de Sede',
    navGroups: [
      {
        label: 'Listado',
        items: [{ to: '/grupos', label: 'Mis Grupos', icon: 'bi-collection' }],
      },
      {
        label: 'Diagnóstico y Analítica',
        items: [{ to: '/metricas-tronco-comun', label: 'Mis Metricas', icon: 'bi-graph-up', end: true }],
      },
      {
        label: 'Grupos Activos',
        items: [],
        dynamic: true,
      },
      {
        label: 'Gestión Académica',
        items: [
          { to: '/catalogo-grupos', label: 'Grupos Plantel', icon: 'bi-grid-3x3-gap' },
          { to: '/catalogo-docentes', label: 'Docentes', icon: 'bi-people' },
          { to: '/catalogo-alumnos', label: 'Alumnos', icon: 'bi-people' },
          { to: '/materias', label: 'Materias', icon: 'bi-journal-bookmark' },
        ],
      },

    ],
  },

  docente: {
    roleLabel: 'Docente Titular',
    navGroups: [
      {
        label: 'Listado',
        items: [{ to: '/grupos', label: 'Mis Grupos', icon: 'bi-people' }],
      },
      {
        label: 'Diagnóstico y Analítica',
        items: [{ to: '/metricas-tronco-comun', label: 'Metricas', icon: 'bi-graph-up',end: true }],
      },
      {
        label: 'Grupos Activos',
        items: [],
        dynamic: true,
      },
    ],
  },

  alumno: {
  roleLabel: 'Alumno',
  navGroups: [
    {
      label: 'Listado',
      items: [
        { to: '/alumno', label: 'Inicio y grupos', icon: 'bi-house', end:true},
      ],
    },
  ],
},
};

export const contextSidebarConfigByRole: Record<string, ContextSidebarConfig> = {
directorGeneral: {
  mode: 'planteles',
  title: 'Detalle Planteles',
  detailItems: [
    { to: '/catalogo-grupos?plantelId={plantelId}', label: 'Grupos', icon: 'bi-grid-3x3-gap' },
    { to: '/catalogo-docentes?plantelId={plantelId}', label: 'Docentes', icon: 'bi-people' },
    { to: '/catalogo-alumnos?plantelId={plantelId}', label: 'Alumnos', icon: 'bi-mortarboard' },
    { to: '/plantel/dashboard?plantelId={plantelId}', label: 'Métricas', icon: 'bi-bar-chart-line' },
  ],
},
directorPlantel: {
  mode: 'activeGroups',
  title: 'Grupos Activos',
},
coordinador: {
  mode: 'activeGroups',
  title: 'Mis Grupos',
},
docente: {
  mode: 'activeGroups',
  title: 'Mis Grupos',
},
admin: { mode: 'none', title: '' },
dev: { mode: 'none', title: '' },
alumno: { mode: 'none', title: '' },
};