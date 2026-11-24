import type { SubmitEvent } from 'react';

interface Props {
  open: boolean;
  title: string;
  nombre: string;
  prefijo: string;
  numero: number;
  error: string;
  valid: boolean;
  onNombreChange: (value: string) => void;
  onPrefijoChange: (value: string) => void;
  onNumeroChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function MateriaMetadataModal({
  open,
  title,
  nombre,
  prefijo,
  numero,
  error,
  valid,
  onNombreChange,
  onPrefijoChange,
  onNumeroChange,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <article
      className="materia-canvas-setup-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="materia-setup-title"
    >
      <header className="materia-canvas-setup-header">
        <button
          type="button"
          className="materia-canvas-setup-close"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <i className="bi bi-x-lg" />
        </button>
        <h2 id="materia-setup-title">{title}</h2>
      </header>
      <form
        className="materia-canvas-setup"
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <div className="materia-canvas-form-field">
          <label htmlFor="materia-nombre">Nombre de la materia</label>
          <input
            id="materia-nombre"
            value={nombre}
            autoFocus
            onChange={(event) => onNombreChange(event.target.value)}
          />
        </div>
        <div className="materia-canvas-form-field">
          <label htmlFor="materia-prefijo">Prefijo</label>
          <div className="materia-canvas-prefix">
            <input
              id="materia-prefijo"
              value={prefijo}
              maxLength={4}
              onChange={(event) => onPrefijoChange(
                event.target.value
                  .replace(/[^a-zA-Z]/g, '')
                  .slice(0, 4)
                  .toUpperCase(),
              )}
            />
            <input
              type="number"
              min={1}
              max={9}
              value={numero}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isInteger(value) && value >= 1 && value <= 9) {
                  onNumeroChange(value);
                }
              }}
              aria-label="Número del prefijo"
            />
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <footer className="materia-canvas-setup-footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!valid}
          >
            Continuar
          </button>
        </footer>
      </form>
    </article>
  );
}
