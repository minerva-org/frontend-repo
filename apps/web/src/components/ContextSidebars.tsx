import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/ApiClient';
import { fetchPersonaActual } from '../services/personaService';
import { contextSidebarConfigByRole } from '../services/sidebarConfig';
import type { GrupoBackend } from '../types/GrupoTypes';
import '../styles/ContextSidebars.css';

interface PlantelOption {
  id: number;
  nombre: string;
  activo: boolean;
}

export default function ContextSidebars() {
  const { role, email, user, selectedPlantel, setSelectedPlantel } = useAuth();
  const [planteles, setPlanteles] = useState<PlantelOption[]>([]);
  const [gruposActivos, setGruposActivos] = useState<GrupoBackend[]>([]);
  const [contextPlantel, setContextPlantel] = useState<{ id: number; nombre: string } | null>(null);
  const contextConfig = role ? contextSidebarConfigByRole[role] : undefined;

  useEffect(() => {
    if (contextConfig?.mode !== 'planteles') {
      return;
    }

    let active = true;

    async function loadPlanteles() {
      try {
        const response = await apiClient.get<PlantelOption[]>('/api/planteles');
        if (active) {
          setPlanteles((response.data ?? []).filter((plantel) => plantel.activo !== false));
        }
      } catch {
        if (active) setPlanteles([]);
      }
    }

    void loadPlanteles();
    return () => {
      active = false;
    };
  }, [contextConfig?.mode]);

  useEffect(() => {
    if (contextConfig?.mode !== 'activeGroups') {
      return;
    }

    let active = true;

    async function loadGruposActivos() {
      try {
        let response;

        if (role === 'docente') {
          const docenteId = user?.personaId ?? user?.id;
          response = docenteId
            ? await apiClient.get<GrupoBackend[]>('/api/grupos', { params: { docenteId } })
            : await apiClient.get<GrupoBackend[]>('/api/grupos');
        } else if (role === 'coordinador' || role === 'directorPlantel') {
          const personaResponse = await fetchPersonaActual();
          const plantelId = personaResponse.data?.plantelId ?? null;
          if (plantelId == null) return;

          response = await apiClient.get<GrupoBackend[]>('/api/grupos', {
            params: { plantelId },
          });
        }

        if (!active) return;

        const grupos = response?.data ?? [];
        setGruposActivos(grupos.filter((grupo) => grupo.activo !== false));
      } catch {
        if (active) setGruposActivos([]);
      }
    }

    void loadGruposActivos();
    return () => {
      active = false;
    };
  }, [contextConfig?.mode, role, email, user?.id, user?.personaId]);

  useEffect(() => {
    function handleClickFuera(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.context-sidebar')) return;
      if (contextConfig?.mode === 'planteles') {
        setContextPlantel(null);
      }
    }

    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [contextConfig?.mode]);

  if (contextConfig?.mode === 'planteles') {
    return (
      <aside className="context-sidebars" aria-label="Contexto de planteles">
        {contextPlantel && (
          <aside className="context-sidebar context-sidebar-detail" aria-label={`Opciones de ${contextPlantel.nombre}`}>
            <header className="context-sidebar-header">
              <span>{contextPlantel.nombre}</span>
            </header>
            <nav className="context-sidebar-list">
              {(contextConfig.detailItems ?? []).map((item) => {
                const to = item.to.replace('{plantelId}', String(contextPlantel.id));
                return (
                  <NavLink
                    key={item.to}
                    to={to}
                    end={item.end}
                    onClick={() => setSelectedPlantel(contextPlantel)}
                    className={({ isActive }) =>
                      `context-sidebar-item ${isActive && selectedPlantel?.id === contextPlantel.id ? 'active' : ''}`
                    }
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        )}
        <aside className="context-sidebar context-sidebar-planteles" aria-label="Planteles">
          <header className="context-sidebar-header">
            <span>{contextConfig.title}</span>
          </header>
          <nav className="context-sidebar-list">
            {planteles.map((plantel) => (
              <button
                key={plantel.id}
                type="button"
                className={`context-sidebar-item ${contextPlantel?.id === plantel.id ? 'active' : ''}`}
                onClick={() => {
                  setContextPlantel(contextPlantel?.id === plantel.id
                    ? null
                    : { id: plantel.id, nombre: plantel.nombre });
                }}
                aria-current={contextPlantel?.id === plantel.id ? 'true' : undefined}
              >
                <i className="bi bi-building"></i>
                <span>{plantel.nombre}</span>
              </button>
            ))}
          </nav>
        </aside>
      </aside>
    );
  }

  if (contextConfig?.mode === 'activeGroups') {
    return (
      <aside className="context-sidebars" aria-label={contextConfig.title}>
        <aside className="context-sidebar context-sidebar-planteles" aria-label={contextConfig.title}>
          <header className="context-sidebar-header">
            <span>{contextConfig.title}</span>
          </header>
          <nav className="context-sidebar-list">
            {gruposActivos.map((grupo) => (
              <NavLink
                key={grupo.id}
                to={`/grupos/${grupo.id}`}
                className={({ isActive }) => `context-sidebar-item ${isActive ? 'active' : ''}`}
                title={grupo.nombre}
              >
                <i className="bi bi-collection"></i>
                <span>{grupo.nombre}</span>
              </NavLink>
            ))}
            {gruposActivos.length === 0 && (
              <span className="context-sidebar-empty">Sin grupos activos</span>
            )}
          </nav>
        </aside>
      </aside>
    );
  }

  return null;
}
