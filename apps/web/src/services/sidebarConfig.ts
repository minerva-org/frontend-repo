import type { SidebarConfig } from './sidebarTypes.ts';

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
          { to: '/planteles', label: 'Catálogo de Planteles', icon: 'bi-building' },
          { to: '/directores-planteles', label: 'Catálogo de Directores Planteles', icon: 'bi-people' },
          { to: '/materias', label: 'Catálogo de Materias', icon: 'bi-journal-bookmark' },
          { to: '/metricas-tronco-comun', label: 'Métricas de Tronco Común', icon: 'bi-bar-chart-line' },
        ],
      },
    ],
  },

  directorPlantel: {
    roleLabel: 'Director de Plantel',
    navGroups: [
      {
        label: 'Dirección de Sede',
        items: [
          { to: '/plantel/dashboard', label: 'Dashboard Ejecutivo Local', icon: 'bi-speedometer2' },
          { to: '/plantel/directorio-docente', label: 'Directorio Docente', icon: 'bi-person-badge' },
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
        items: [{ to: '/metricas-aprendizaje', label: 'Metricas de aprendizaje', icon: 'bi-graph-up', end: true }],
      },
      {
        label: 'Grupos Activos',
        items: [],
        dynamic: true,
      },
      {
        label: 'Gestión Académica',
        items: [
          { to: '/catalogo-grupos', label: 'Catálogo de Grupos', icon: 'bi-grid-3x3-gap' },
          { to: '/catalogo-docentes', label: 'Catálogo de Docentes', icon: 'bi-people' },
          { to: '/catalogo-alumnos', label: 'Catálogo de Alumnos', icon: 'bi-people' },
          { to: '/materias', label: 'Materias y Planes (S3)', icon: 'bi-journal-bookmark' },
        ],
      },
      {
        label: 'Supervisión',
        items: [{ to: '/avance-curricular', label: 'Avance Curricular de Sede', icon: 'bi-bar-chart-line' }],
      },
    ],
  },

  docente: {
    roleLabel: 'Docente Titular',
    navGroups: [
      {
        label: 'Listado',
        items: [{ to: '/grupos', label: 'Catálogo de Grupos', icon: 'bi-people' }],
      },
      {
        label: 'Diagnóstico y Analítica',
        items: [{ to: '/metricas-aprendizaje', label: 'Metricas de aprendizaje', icon: 'bi-graph-up',end: true }],
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
        { to: '/alumno', label: 'Inicio', icon: 'bi-house', end:true},
        { to: '/alumno/grupos', label: 'Mis Grupos', icon: 'bi-collection' },
      ],
    },
  ],
},
};