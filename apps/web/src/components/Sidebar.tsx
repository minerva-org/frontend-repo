import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import type { SidebarConfig, SidebarNavItem } from '../services/sidebarTypes.ts';
import { apiClient } from '../services/ApiClient';
import '../styles/Sidebar.css';

interface SidebarProps {
  config: SidebarConfig;
  dynamicGroupItems?: SidebarNavItem[];
}

interface PlantelOption {
  id: number;
  nombre: string;
  activo: boolean;
}

const CICLO_ACTIVO = 'Ciclo Activo Ago-Dic 2026';

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function Sidebar({ config, dynamicGroupItems = [] }: SidebarProps) {
  const {
    email,
    logout,
    role,
    selectedPlantel,
    setSelectedPlantel,
  } = useAuth() as {
    email?: string | null;
    logout?: () => void;
    role?: string | null;
    selectedPlantel?: { id: number; nombre: string } | null;
    setSelectedPlantel?: (next: { id: number; nombre: string } | null) => void;
  };
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [planteles, setPlanteles] = useState<PlantelOption[]>([]);
  const isDG = role === 'directorGeneral';

  useEffect(() => {
    if (!isDG) return;

    async function loadPlanteles() {
      try {
        const response = await apiClient.get<PlantelOption[]>('/api/planteles');
        const activos = (response.data ?? []).filter((item) => item.activo !== false);
        setPlanteles(activos);
      } catch {
        setPlanteles([]);
      }
    }

    void loadPlanteles();
  }, [isDG]);

  const nombre = email ?? config.roleLabel;

  function handlePlantelClick(plantel: PlantelOption) {
    setSelectedPlantel?.({ id: plantel.id, nombre: plantel.nombre });
    navigate(`/grupos?plantelId=${plantel.id}`);
  }

  function handleLogout() {
    logout?.();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={`sd-sidebar ${collapsed ? 'sd-sidebar-collapsed' : ''}`}>
      <article className="sd-brand">
        <span className="sd-brand-logo">
          <i className="bi bi-mortarboard-fill"></i>
        </span>
        <article className="sd-brand-text">
          <span className="sd-brand-title">Preparatoria Chapala</span>
          <span className="sd-brand-subtitle">{CICLO_ACTIVO}</span>
        </article>
      </article>

      <nav className="sd-nav">
        {config.navGroups.map((group) => {
          const items = group.dynamic ? dynamicGroupItems : group.items;
          if (items.length === 0) return null;

          return (
            <article className="sd-nav-group" key={group.label ?? items[0].to}>
              {group.label && <p className="sd-nav-label">{group.label}</p>}
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? true}
                  className={({ isActive }) => `sd-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </article>
          );
        })}
      </nav>

      <article className="sd-user">
        <span className="sd-user-avatar">{iniciales(nombre)}</span>
        <article className="sd-user-text">
          <span className="sd-user-name">{nombre}</span>
          <span className="sd-user-role">{config.roleLabel}</span>
          {isDG && selectedPlantel && (
            <span className="sd-user-role">Plantel Activo: {selectedPlantel.nombre}</span>
          )}
        </article>
        <button className="sd-user-logout" onClick={handleLogout} title="Cerrar sesión">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </article>

      {isDG && (
        <article className="sd-dg-panel">
          <p className="sd-dg-title">
            Planteles
          </p>
          <article className="sd-dg-planteles" aria-label="Listado de planteles">
            {planteles.map((plantel) => {
              const active = selectedPlantel?.id === plantel.id;
              return (
                <button
                  key={plantel.id}
                  type="button"
                  className={`sd-dg-plantel-item ${active ? 'active' : ''}`}
                  onClick={() => handlePlantelClick(plantel)}
                >
                  <i className="bi bi-building"></i>
                  <span>{plantel.nombre}</span>
                </button>
              );
            })}
          </article>

          {selectedPlantel && (
            <article className="sd-dg-extra" aria-label="Accesos del plantel seleccionado">
              <p className="sd-dg-title">Gestión de {selectedPlantel.nombre}</p>
              <NavLink to={`/grupos?plantelId=${selectedPlantel.id}`} className="sd-nav-link" end>
                <i className="bi bi-collection"></i>
                <span>Grupos del plantel</span>
              </NavLink>
              <NavLink to={`/catalogo-docentes?plantelId=${selectedPlantel.id}`} className="sd-nav-link" end>
                <i className="bi bi-people"></i>
                <span>Docentes</span>
              </NavLink>
              <NavLink to={`/catalogo-alumnos?plantelId=${selectedPlantel.id}`} className="sd-nav-link" end>
                <i className="bi bi-mortarboard"></i>
                <span>Alumnos</span>
              </NavLink>
              <NavLink to={`/plantel/dashboard?plantelId=${selectedPlantel.id}`} className="sd-nav-link" end>
                <i className="bi bi-bar-chart-line"></i>
                <span>Métricas de plantel</span>
              </NavLink>
            </article>
          )}
        </article>
      )}
    </aside>
  );
}