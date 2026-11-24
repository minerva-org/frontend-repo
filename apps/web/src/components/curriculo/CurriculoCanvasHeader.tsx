interface Props {
  title: string;
  subtitle?: string;
  dirty: boolean;
  onBack: () => void;
  onDiscard: () => void;
  onSave: () => void;
  onEditMetadata?: () => void;
}

export default function CurriculoCanvasHeader({
  title,
  subtitle,
  dirty,
  onBack,
  onDiscard,
  onSave,
  onEditMetadata,
}: Props) {
  return (
    <header className="curriculo-header">
      <article className="curriculo-header-left">
        <button
          type="button"
          className="btn btn-outline-secondary curriculo-back"
          onClick={onBack}
        >
          <i className="bi bi-arrow-left me-2" />
          Volver
        </button>
        <article>
          <strong>{title}</strong>
          {subtitle && (
            <small>
              {subtitle}
              {onEditMetadata && (
                <button
                  type="button"
                  className="curriculo-edit-metadata"
                  onClick={onEditMetadata}
                  aria-label="Editar nombre y clave"
                  title="Editar nombre y clave"
                >
                  <i className="bi bi-pencil-square" />
                </button>
              )}
            </small>
          )}
        </article>
      </article>
      <article className="curriculo-header-actions">
        {dirty && (
          <span className="curriculo-dirty">Cambios sin guardar</span>
        )}
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onDiscard}
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
