import { useSidebar } from '../../context/SidebarContext.tsx';
import SidebarToggleIcon from './SidebarToggleIcon.tsx';
import '../../styles/AppPageHeader.css';

interface AppPageHeaderProps {
  title: string;
}

export default function AppPageHeader({ title }: AppPageHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="app-page-header">
      <button
        type="button"
        className="app-page-header-toggle"
        onClick={toggleSidebar}
        title="Mostrar u ocultar menú"
        aria-label="Mostrar u ocultar menú"
      >
        <SidebarToggleIcon />
      </button>
      <span className="app-page-header-title">{title}</span>
    </header>
  );
}
