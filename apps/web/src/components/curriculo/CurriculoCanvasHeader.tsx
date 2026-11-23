interface Props {
  grupoNombre: string;
  materiaNombre: string;
  docenteNombre: string;
  dirty: boolean;
  onBack: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export default function CurriculoCanvasHeader({
  grupoNombre,
  materiaNombre,
  docenteNombre,
  dirty,
  onBack,
  onDiscard,
  onSave,
}: Props) {
  return (
    <header className="curriculo-header">
      <article className="curriculo-header-left">
        <button
          type="button"
          className="btn btn-outline-secondary curriculo-back"
          onClick={onDiscard}
        >
          <i className="bi bi-arrow-left me-2" />
          Volver
        </button>
        <article>
          <strong>{grupoNombre}</strong>
          <small>{materiaNombre} · {docenteNombre}</small>
        </article>
      </article>
      <article className="curriculo-header-actions">
        {dirty && (
          <span className="curriculo-dirty">Cambios sin guardar</span>
        )}
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onBack}
          disabled={!dirty}
        >
          Descartar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={!dirty}
        >
          Guardar
        </button>
      </article>
    </header>
  );
}
