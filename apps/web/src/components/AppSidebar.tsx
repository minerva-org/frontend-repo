import { useAuth } from '../context/AuthContext.tsx';
import Sidebar from './Sidebar.tsx';
import { sidebarConfigByRole } from '../services/sidebarConfig.ts';

export default function AppSidebar() {
  const { role } = useAuth();
  if (!role) return null;

  const config = sidebarConfigByRole[role];
  if (!config) return null;

  return (
    <Sidebar
      config={config}
    />
  );
}