import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextValue {
  collapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () =>{
    if (window.matchMedia('(max-width: 640px)').matches){
      setMobileOpen((prev) => !prev);
    } else{
      setCollapsed((prev) => !prev);
    }
  };
  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggleSidebar, mobileOpen, openMobile, closeMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar debe usarse dentro de un <SidebarProvider>.');
  }
  return ctx;
}