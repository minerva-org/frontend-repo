interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CurriculoDiscardConfirm({
  open,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <section
      className="curriculo-generating"
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirmar descarte"
    >
      <article className="curriculo-back-confirm">
        <strong>¿Descartar los cambios sin guardar?</strong>
        <p className="text-secondary text-center mb-0">
          Se restaurará el último currículo cargado o guardado.
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
            Descartar cambios
          </button>
        </article>
      </article>
    </section>
  );
}
