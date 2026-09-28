export interface SidebarNavItem {
  to: string;
  label: string;
  icon: string; 
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
  dynamic?: boolean;
}

export interface SidebarConfig {
  roleLabel: string;
  navGroups: SidebarNavGroup[];
}