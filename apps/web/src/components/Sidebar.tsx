
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';

import type { SidebarConfig, SidebarNavItem } from '../types/sidebarTypes.ts';

import logo from '../assets/logo.webp';

interface SidebarProps {
  config: SidebarConfig;
  dynamicGroupItems?: SidebarNavItem[];
}

type Modo = 'movil' | 'tablet' | 'escritorio';

const CICLO_ACTIVO = 'Ciclo Activo Ago-Dic 2026';

function leerModo(): Modo {
  if (window.matchMedia('(max-width: 640px)').matches) return 'movil';
  if (window.matchMedia('(max-width: 1024px)').matches) return 'tablet';
  return 'escritorio';
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join('');
}

export default function Sidebar({
  config,
  dynamicGroupItems = [],
}: SidebarProps) {
  const { email, logout } = useAuth() as {
    email?: string | null;
    logout?: () => void;
  };

  const { collapsed, toggleSidebar, mobileOpen, closeMobile } = useSidebar();

  const navigate = useNavigate();

  const [modo, setModo] = useState<Modo>(leerModo);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    bottom?: number;
    top?: number;
  }>({
    left: 0,
    bottom: 0,
  });

  const cancelarRef = useRef<HTMLButtonElement>(null);
  const userRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  const nombre = email ?? config.roleLabel;

  const esMovil = modo === 'movil';
  const esTablet = modo === 'tablet';
  const compacto = collapsed && !esMovil;

  useEffect(() => {
    const consultas = [
      window.matchMedia('(max-width: 640px)'),
      window.matchMedia('(max-width: 1024px)'),
    ];

    const actualizar = () => setModo(leerModo());

    consultas.forEach((consulta) =>
      consulta.addEventListener('change', actualizar)
    );

    return () =>
      consultas.forEach((consulta) =>
        consulta.removeEventListener('change', actualizar)
      );
  }, []);

  useEffect(() => {
    if (!esMovil) closeMobile();
  }, [esMovil, closeMobile]);

  useEffect(() => {
    if (confirmarLogout) cancelarRef.current?.focus();
  }, [confirmarLogout]);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      const objetivo = e.target as Node;

      if (menuRef.current?.contains(objetivo)) return;

      if (userRef.current && !userRef.current.contains(objetivo)) {
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

  function cerrarAlNavegar() {
    if (esMovil) {
      closeMobile();
    } else if (esTablet && !collapsed) {
      toggleSidebar();
    }
  }

  function toggleUserMenu() {
    if(!menuOpen && userRef.current){
      const rect = userRef.current.getBoundingClientRect();
        setMenuPosition({
          left: esMovil ? rect.left + 8 : rect.right - 50,
          bottom: window.innerHeight - rect.top + 4,
        });
      }
      setMenuOpen((prev) => !prev);

    }
  

  function handleConfirmarLogout() {
    setConfirmarLogout(false);
    setMenuOpen(false);

    logout?.();

    navigate('/login', { replace: true });
  }


  const claseAside = esMovil
    ? `offcanvas offcanvas-start ${mobileOpen ? 'show' : ''}`
    : esTablet
      ? 'position-fixed top-0 bottom-0'
      : 'align-self-start vh-100';

  const estiloAside: CSSProperties = esMovil
    ? ({
        '--bs-offcanvas-width': 'min(17.5rem, 85vw)',
      } as CSSProperties)
    : esTablet
      ? { zIndex: 1045 }
      : { position: 'sticky', top:0, zIndex:40};

  return (
    <>
      {/* Fondo oscuro para móvil y tablet expandida. */}
      {((esMovil && mobileOpen) || (esTablet && !collapsed)) && (
        <article
          className="offcanvas-backdrop fade show"
          onClick={esMovil ? closeMobile : toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar principal. */}
      <aside
        className={`
          d-flex flex-column flex-shrink-0
          overflow-hidden bg-primary text-light
          border-end border-light border-opacity-10
          ${claseAside}
        `}
        style={{
          height: '100dvh',
          width: esMovil
            ? undefined
            : compacto
              ? '5.25rem'
              : '17.5rem',
          minWidth: compacto ? '5.25rem' : undefined,
          transition: 'width 0.2s ease',
          ...estiloAside,
        }}
      >
        {/* Identidad institucional. */}
        <article
          className={`
            d-flex align-items-center gap-2 flex-shrink-0
            border-bottom border-light border-opacity-10
            ${compacto ? 'justify-content-center p-2' : 'p-3'}
          `}
        >
          <img
            src={logo}
            alt="Logo Preparatoria Chapala"
            title="Preparatoria Chapala"
            width={40}
            height={40}
            className="rounded-3 bg-light object-fit-contain flex-shrink-0"
          />

          {!compacto && (
            <article className="overflow-hidden lh-sm">
              <span className="d-block fw-bold small text-truncate">
                Preparatoria Chapala
              </span>

              <span className="d-block small text-light text-opacity-50 text-truncate">
                {CICLO_ACTIVO}
              </span>
            </article>
          )}
        </article>

        {/* Navegación. */}
        <nav
          className={`
            d-flex flex-column flex-grow-1 overflow-y-auto
            ${compacto ? 'p-1 gap-2' : 'p-2 gap-3'}
          `}
        >
          {config.navGroups.map((group) => {
            const items = group.dynamic
              ? dynamicGroupItems
              : group.items;

            if (items.length === 0) return null;

            return (
              <article key={group.label ?? items[0].to}>
                {!compacto && group.label && (
                  <p className="small fw-bold text-uppercase text-light text-opacity-50 px-2 mb-1">
                    {group.label}
                  </p>
                )}

                <article className="nav nav-pills flex-column gap-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end ?? true}
                      onClick={cerrarAlNavegar}
                      title={item.label}
                      aria-label={item.label}
                      className={({ isActive }) => `
                        nav-link d-flex align-items-center gap-2
                        fw-semibold small
                        ${
                          compacto
                            ? 'flex-column justify-content-center text-center px-1 py-2'
                            : 'px-3 py-2'
                        }
                        ${isActive ? 'active' : 'text-light'}
                      `}
                    >
                      <i className={`bi ${item.icon}`} />

                      <span
                        className={compacto ? 'w-100 fw-bold' : ''}
                        style={ compacto 
                          ? {
                                fontSize: '0.72rem',
                                lineHeight: 1.1,
                              }: undefined
                        }>
                        {item.label}
                      </span>
                    </NavLink>
                  ))}
                </article>
              </article>
            );
          })}
        </nav>

        {/* Usuario y opciones de cuenta. */}
        <article className="flex-shrink-0" ref={userRef}>
          <button
            type="button"
            className={`
              btn w-100 d-flex align-items-center gap-2
              text-light text-start rounded-0
              border-0 border-top border-light border-opacity-10 p-3
              ${compacto ? 'justify-content-center' : ''}
            `}
            onClick={toggleUserMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span
              className="rounded-circle bg-secondary text-light fw-bold small d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '2.2rem',
                height: '2.2rem',
              }}
            >
              {iniciales(nombre)}
            </span>

            {!compacto && (
              <>
                <span className="flex-grow-1 fw-bold small text-truncate">
                  {nombre}
                </span>

                <i className={`bi ${menuOpen ? 'bi-chevron-down' : 'bi-chevron-up'} text-light text-opacity-50`}
                />
              </>
            )}
          </button>

          {/* Menú desplegable del usuario. */}
          {menuOpen &&
            createPortal(
              <article
                ref={menuRef}
                className="position-fixed d-flex flex-column gap-1 p-2 bg-light border rounded-3 shadow"
                role="menu"
                style={{
                  left: menuPosition.left,
                  top: menuPosition.top,
                  bottom: menuPosition.bottom,
                  width: '12rem',
                  zIndex: 1050,
                }}
              >
                <button
                  type="button"
                  className="btn btn-light btn-sm d-flex align-items-center gap-2 text-start fw-semibold"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    cerrarAlNavegar();
                    navigate('/mi-perfil');
                  }}
                >
                  <i className="bi bi-person" />
                  Perfil
                </button>

                <button
                  type="button"
                  className="btn btn-light btn-sm d-flex align-items-center gap-2 text-start fw-semibold"
                  style={{ color: 'var(--seige-error-texto)' }}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmarLogout(true);
                  }}
                >
                  <i className="bi bi-box-arrow-right" />
                  Cerrar sesión
                </button>
              </article>,
              document.body
            )}
        </article>
      </aside>

      {/* Confirmación de cierre de sesión. */}
      {confirmarLogout &&
        createPortal(
          <article
            className="modal show d-block"
            tabIndex={-1}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sd-logout-title"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
          >
            <article className="modal-dialog modal-dialog-centered modal-sm">
              <article className="modal-content border-0 shadow">
                <article className="modal-body p-4">
                  <h2 id="sd-logout-title" className="h5 fw-bold mb-3">
                    ¿Seguro que quieres salir?
                  </h2>

                  <article className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      ref={cancelarRef}
                      onClick={() => setConfirmarLogout(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleConfirmarLogout}
                    >
                      Aceptar
                    </button>
                  </article>
                </article>
              </article>
            </article>
          </article>,
          document.body
        )}
    </>
  );
}
