interface Props {
  open: boolean;
  onSaveAndExit: () => void;
  onDiscardAndExit: () => void;
  onContinue: () => void;
}

export default function CurriculoBackConfirm({
  open,
  onSaveAndExit,
  onDiscardAndExit,
  onContinue,
}: Props) {
  if (!open) return null;

  return (
    <section
      className="curriculo-generating"
      role="dialog"
      aria-modal="true"
      aria-label="Cambios sin guardar"
    >
      <article className="curriculo-back-confirm">
        <strong>Tienes cambios sin guardar</strong>
        <p className="text-secondary text-center mb-0">
          ¿Qué deseas hacer antes de volver a la vista del grupo?
        </p>
        <article className="d-flex justify-content-center gap-2 mt-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onContinue}
          >
            Continuar editando
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={onDiscardAndExit}
          >
            Descartar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSaveAndExit}
          >
            Guardar y salir
          </button>
        </article>
      </article>
    </section>
  );
}
