import '../../styles/TaskGeneratingOverlay.css';

interface Props {
  open: boolean;
  name: string;
  descendants: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CurriculoDeleteConfirm({
  open,
  name,
  descendants,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <section
      className="task-generating"
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirmar eliminación"
    >
      <article className="curriculo-back-confirm">
        <strong>¿Eliminar {name}?</strong>
        <p className="text-secondary text-center mb-0">
          {descendants > 0
            ? `También se eliminarán ${descendants} elemento${descendants === 1 ? '' : 's'} hijo${descendants === 1 ? '' : 's'}.`
            : 'Este elemento no tiene hijos.'}
        </p>
        <article className="d-flex justify-content-center gap-2 mt-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </article>
      </article>
    </section>
  );
}
