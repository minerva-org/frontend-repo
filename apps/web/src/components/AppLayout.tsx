import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar.tsx';
import { SidebarProvider } from '../context/SidebarContext.tsx';
import '../styles/AppLayout.css';

export default function AppLayout() {
  return (
    <SidebarProvider>
      <article className="app-layout">
        <AppSidebar />
        <main className="app-layout-content">
          <Outlet />
        </main>
      </article>
    </SidebarProvider>
  );
}