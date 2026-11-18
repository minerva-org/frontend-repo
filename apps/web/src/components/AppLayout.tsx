import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar.tsx';
import { SidebarProvider } from '../context/SidebarContext.tsx';
import ContextSidebars from './ContextSidebars.tsx';
import '../styles/AppLayout.css';

export default function AppLayout() {
  return (
    <SidebarProvider>
      <article className="app-layout">
        <AppSidebar />
        <main className="app-layout-content">
          <Outlet />
        </main>
        <ContextSidebars />
      </article>
    </SidebarProvider>
  );
}