import GroupMenuActionButton from './GroupMenuActionButton.tsx';

export interface GroupActionsMenuGroup {
  id: string;
  nombre: string;
}

interface GroupActionsMenuProps<T extends GroupActionsMenuGroup> {
  group: T;
  isOpen: boolean;
  onToggle: (groupId: string | null) => void;
  onView: (groupId: string) => void;
  onArchive?: (group: T) => void;
  onReactivate?: (groupId: string) => void;
  archived?: boolean;
}

export default function GroupActionsMenu<T extends GroupActionsMenuGroup>({
  group,
  isOpen,
  onToggle,
  onView,
  onArchive,
  onReactivate,
  archived = false,
}: GroupActionsMenuProps<T>) {
  return (
    <div className="groups-action-menu">
      <button
        className="groups-link-button groups-menu-toggle"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle(isOpen ? null : group.id);
        }}
        aria-expanded={isOpen}
        aria-label={`Opciones para ${group.nombre}`}
      >
        <i className="bi bi-list"></i> Opciones
      </button>

      {isOpen && (
        <div
          className="groups-menu-panel"
          role="menu"
          aria-label={`Acciones para ${group.nombre}`}
          onClick={(event) => event.stopPropagation()}
        >
          <GroupMenuActionButton
            label="Ver"
            icon="bi-eye"
            onClick={() => {
              onToggle(null);
              onView(group.id);
            }}
          />

          {archived ? (
            <GroupMenuActionButton
              label="Reactivar"
              icon="bi-arrow-counterclockwise"
              onClick={() => {
                onToggle(null);
                onReactivate?.(group.id);
              }}
            />
          ) : (
            <GroupMenuActionButton
              label="Archivar"
              icon="bi-archive"
              variant="danger"
              onClick={() => {
                onToggle(null);
                onArchive?.(group);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
