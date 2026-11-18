import { useSidebar } from '../../context/SidebarContext';

interface SidebarToggleIconProps {
  className?: string;
}

export default function SidebarToggleIcon({ className = '' }: SidebarToggleIconProps) {
  const { collapsed } = useSidebar();
  const icon = collapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset';

  return <i className={`bi ${icon}${className ? ` ${className}` : ''}`} aria-hidden="true" />;
}
