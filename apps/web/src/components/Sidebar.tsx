import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import type { SidebarConfig, SidebarNavItem } from '../services/sidebarTypes.ts';
import '../styles/Sidebar.css';

interface SidebarProps {
  config: SidebarConfig;
  dynamicGroupItems?: SidebarNavItem[];
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
  const { email, logout } = useAuth() as { email?: string | null; logout?: () => void };
  const { collapsed } = useSidebar();

  const nombre = email ?? config.roleLabel;

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
        </article>
        <button className="sd-user-logout" onClick={logout} title="Cerrar sesión">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </article>
    </aside>
  );
}