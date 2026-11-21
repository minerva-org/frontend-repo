import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import type { SidebarConfig, SidebarNavItem } from '../types/sidebarTypes.ts';
import '../styles/Sidebar.css';
import logo from '../assets/logo.webp';

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
  const {
    email,
    logout,
  } = useAuth() as {
    email?: string | null;
    logout?: () => void;
  };
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ left: number; bottom?: number; top?: number }>({
    left: 0,
    bottom: 0,
  });
  const [confirmarLogout, setConfirmarLogout] = useState(false);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const nombre = email ?? config.roleLabel;

  useEffect(() => {
    if (confirmarLogout) {
      cancelarRef.current?.focus();
    }
  }, [confirmarLogout]);

  function toggleUserMenu() {
    setMenuOpen((prev) => {
      if (!prev && userRef.current) {
        const rect = userRef.current.getBoundingClientRect();
        if (window.innerWidth <= 767) {
          setMenuPosition({
            left: rect.left,
            top: rect.bottom + 8,
          });
        } else {
          setMenuPosition({
            left: rect.right - 50,
            bottom: window.innerHeight - rect.top + 4,
          });
        }
      }
      return !prev;
    });
  }

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if ((e.target as Element).closest?.('.sd-user-menu')) return;
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setConfirmarLogout(false);
      }
    }

    document.addEventListener('mousedown', handleClickFuera);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleConfirmarLogout() {
    setConfirmarLogout(false);
    setMenuOpen(false);
    logout?.();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={`sd-sidebar ${collapsed ? 'sd-sidebar-collapsed' : ''}`}>
      <article className="sd-brand">
        <span className="sd-brand-logo" title="Preparatoria Chapala">
          <img src={logo} alt="Logo Preparatoria Chapala" className="sd-brand-logo-img" />
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
                  title={item.label}
                  aria-label={item.label}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </article>
          );
        })}
      </nav>

      <article className="sd-user-wrap" ref={userRef}>
        <button
          type="button"
          className="sd-user"
          onClick={toggleUserMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="sd-user-avatar">{iniciales(nombre)}</span>
          <article className="sd-user-text">
            <span className="sd-user-name">{nombre}</span>
          </article>
          <i className={`bi bi-chevron-up sd-user-chevron ${menuOpen ? 'open' : ''}`}></i>
        </button>

        {menuOpen &&
          createPortal(
            <article
              className="sd-user-menu"
              role="menu"
              style={{
                left: menuPosition.left,
                top: menuPosition.top,
                bottom: menuPosition.bottom,
              }}
            >
              <button 
              type="button" 
              className="sd-user-menu-item" 
              role="menuitem" 
              onClick={() => {
                setMenuOpen(false)
                navigate('/mi-perfil')
              }}>
                <i className="bi bi-person"></i> Perfil
              </button>
              <button
                type="button"
                className="sd-user-menu-item sd-user-menu-danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmarLogout(true);
                }}
              >
                <i className="bi bi-box-arrow-right"></i> Cerrar sesión
              </button>
            </article>,
            document.body
          )}
      </article>

      {confirmarLogout &&
        createPortal(
          <article className="sd-logout-overlay">
            <article className="sd-logout-modal" role="alertdialog" aria-modal="true" aria-labelledby="sd-logout-title">
              <h2 id="sd-logout-title" className="sd-logout-title">¿Seguro que quieres salir?</h2>
              <article className="sd-logout-actions">
                <button type="button" className="sd-logout-btn-secondary" ref={cancelarRef} onClick={() => setConfirmarLogout(false)}>
                  Cancelar
                </button>
                <button type="button" className="sd-logout-btn-primary" onClick={handleConfirmarLogout}>
                  Aceptar
                </button>
              </article>
            </article>
          </article>,
          document.body
        )}
    </aside>
  );
}