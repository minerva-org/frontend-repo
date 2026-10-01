interface GroupMenuActionButtonProps {
  label: string;
  icon: string;
  variant?: 'default' | 'danger';
  onClick: () => void;
}

export default function GroupMenuActionButton({
  label,
  icon,
  variant = 'default',
  onClick,
}: GroupMenuActionButtonProps) {
  return (
    <button
      type="button"
      className={`groups-menu-item${variant === 'danger' ? ' groups-menu-item-danger' : ''}`}
      onClick={onClick}
    >
      <i className={`bi ${icon}`}></i> {label}
    </button>
  );
}
