import { useAuth } from '../context/AuthContext.tsx';
import Sidebar from './Sidebar.tsx';
import { sidebarConfigByRole } from '../services/sidebarConfig.ts';
import type { SidebarNavItem } from '../services/sidebarTypes.ts';

const MOCK_GRUPOS_ACTIVOS: SidebarNavItem[] = [
  { to: '/grupos/MAT3-A', label: 'MAT3-A', icon: 'bi-bar-chart-line', end:true},
];

export default function AppSidebar() {
  const { role } = useAuth();
  if (!role) return null;

  const config = sidebarConfigByRole[role];
  if (!config) return null;

  const necesitaGruposActivos = config.navGroups.some((g) => g.dynamic);

  return (
    <Sidebar
      config={config}
      dynamicGroupItems={necesitaGruposActivos ? MOCK_GRUPOS_ACTIVOS : undefined}
    />
  );
}