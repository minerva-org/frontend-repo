import type { RefObject } from 'react';

interface Props {
  archivo: File | null;
  archivoExistenteId: string | null;
  archivoExistenteNombre: string;
  archivoEliminado: boolean;
  generando: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onGenerate: () => void;
}

export default function MateriaPlanPanel({
  archivo,
  archivoExistenteId,
  archivoExistenteNombre,
  archivoEliminado,
  generando,
  fileInputRef,
  onFileChange,
  onGenerate,
}: Props) {
  const hasSource =
    archivo !== null
    || (archivoExistenteId !== null && !archivoEliminado);

  return (
    <aside className="curriculo-sources materia-source-panel">
      <h2>Plan de estudio</h2>
      {archivo ? (
        <section className="curriculo-source-card">
          <span className="curriculo-source-icon">
            <i className="bi bi-file-earmark-pdf" />
          </span>
          <article>
            <strong>{archivo.name}</strong>
            <small>Nueva · reemplazará el árbol</small>
          </article>
        </section>
      ) : archivoExistenteId && !archivoEliminado ? (
        <section className="curriculo-source-card">
          <span className="curriculo-source-icon">
            <i className="bi bi-file-earmark-pdf" />
          </span>
          <article>
            <strong>{archivoExistenteNombre || 'Plan de estudio'}</strong>
            <small>Fuente actual</small>
          </article>
        </section>
      ) : (
        <small className="text-secondary">Sin plan de estudio</small>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        hidden
        onChange={(event) =>
          onFileChange(event.target.files?.[0] ?? null)
        }
      />
      <button
        type="button"
        className="btn btn-outline-secondary curriculo-add-source"
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="bi bi-plus-lg me-2" />
        {hasSource ? 'Cambiar plan' : 'Agregar plan'}
      </button>
      <button
        type="button"
        className="btn btn-secondary curriculo-generate"
        disabled={!archivo || generando}
        onClick={onGenerate}
      >
        <i className="bi bi-stars me-2" />
        Generar estructura
      </button>
    </aside>
  );
}
