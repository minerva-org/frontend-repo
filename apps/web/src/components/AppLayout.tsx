import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar.tsx';
import { SidebarProvider } from '../context/SidebarContext.tsx';
import ContextSidebars from './ContextSidebars.tsx';
import '../styles/AppLayout.css';
import { useAuth } from '../context/AuthContext.tsx';

export default function AppLayout() {
  const { role } = useAuth();
  return (
    <SidebarProvider>
      <article className="app-layout">
        <AppSidebar />
        <main className={`app-layout-content ${
          role === 'alumno' ? 'app-layout-content-full' : ''
        }`}>
          <Outlet />
        </main>
        <ContextSidebars />
      </article>
    </SidebarProvider>
  );
}