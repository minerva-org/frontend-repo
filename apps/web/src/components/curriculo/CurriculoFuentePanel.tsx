import type { RefObject } from 'react';

export interface CurriculoSourceEntry {
  id: string;
  name: string;
  status: 'disponible' | 'nueva';
}

interface Props {
  sources: CurriculoSourceEntry[];
  puedeEditar: boolean;
  hasNewSource: boolean;
  generating: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAddSource: (file?: File) => void;
  onGenerate: () => void;
  onOpenFilePicker: () => void;
}

export default function CurriculoFuentePanel({
  sources,
  puedeEditar,
  hasNewSource,
  generating,
  fileInputRef,
  onAddSource,
  onGenerate,
  onOpenFilePicker,
}: Props) {
  return (
    <aside className="curriculo-sources">
      <h2>Fuentes</h2>
      <section className="curriculo-source-card">
        <span className="curriculo-source-icon">
          <i className="bi bi-file-earmark-pdf" />
        </span>
        <article>
          <strong>Plan de estudio</strong>
          <small>AE026 · PDF</small>
        </article>
        <span className="badge text-bg-secondary">Base</span>
      </section>
      {sources.map((source) => (
        <section className="curriculo-source-card" key={source.id}>
          <span className="curriculo-source-icon">
            <i className="bi bi-journal-text" />
          </span>
          <article>
            <strong>{source.name}</strong>
            <small>
              {source.status === 'nueva'
                ? 'Nueva · no procesada'
                : 'Ejemplo · disponible'}
            </small>
          </article>
          <span
            className={`badge ${
              source.status === 'nueva'
                ? 'text-bg-warning'
                : 'text-bg-secondary'
            }`}
          >
            {source.status === 'nueva' ? 'Nueva' : 'Fuente'}
          </span>
        </section>
      ))}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={(event) => onAddSource(event.target.files?.[0])}
      />
      {puedeEditar && (
        <button
          type="button"
          className="btn btn-outline-secondary curriculo-add-source"
          onClick={onOpenFilePicker}
        >
          <i className="bi bi-plus-lg me-2" />
          Agregar fuente
        </button>
      )}
      {puedeEditar && (
        <button
          type="button"
          className="btn btn-secondary curriculo-generate"
          disabled={!hasNewSource || generating}
          onClick={onGenerate}
        >
          <i className="bi bi-stars me-2" />
          Generar contenido
        </button>
      )}
    </aside>
  );
}
