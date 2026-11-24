import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';
import { nodeIcon } from './NodoCurricular.tsx';

interface Props {
  selected: NodoCurricular | null;
  puedeEditar: boolean;
  editingId: string | null;
  editingContentId: string | null;
  editingContentText: string;
  estadoConcepto: (node: NodoCurricular) => string;
  onEditingId: (id: string | null) => void;
  onFinishName: (id: string, nombre: string) => void;
  onSelectChild: (id: string) => void;
  onEditingContentId: (id: string | null) => void;
  onEditingContentText: (text: string) => void;
  onApplyContent: (conceptoId: string, contenidoId: string, text: string) => void;
  onAddContent: (conceptoId: string) => void;
}

export default function CurriculoDetallePanel({
  selected,
  puedeEditar,
  editingId,
  editingContentId,
  editingContentText,
  estadoConcepto,
  onEditingId,
  onFinishName,
  onSelectChild,
  onEditingContentId,
  onEditingContentText,
  onApplyContent,
  onAddContent,
}: Props) {
  return (
    <aside className="curriculo-detail">
      <h2>Detalle</h2>
      {!selected ? (
        <p className="text-secondary">Selecciona un nodo para ver su detalle.</p>
      ) : (
        <article className="curriculo-detail-card">
          <span className="curriculo-detail-type">{selected.tipo}</span>
          {editingId === selected.id ? (
            <input
              className="form-control"
              defaultValue={selected.nombre}
              autoFocus
              onBlur={() => onEditingId(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onFinishName(selected.id, event.currentTarget.value);
                }
                if (event.key === 'Escape') onEditingId(null);
              }}
            />
          ) : (
            <h3
              onDoubleClick={() =>
                puedeEditar && onEditingId(selected.id)
              }
            >
              {selected.nombre}
            </h3>
          )}
          {selected.tipo === 'concepto' ? (
            <>
              <span
                className={`badge curriculo-state-badge state-${estadoConcepto(selected)}`}
              >
                {estadoConcepto(selected).replaceAll('_', ' ')}
              </span>
              <h4>Contenido</h4>
              {selected.contenido.length === 0 ? (
                <p className="text-secondary">Sin contenido relacionado.</p>
              ) : (
                selected.contenido.map((item) => (
                  <article className="curriculo-content-editor" key={item.id}>
                    {editingContentId === item.id ? (
                      <>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={editingContentText}
                          onChange={(event) =>
                            onEditingContentText(event.target.value)
                          }
                          autoFocus
                        />
                        <article className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => onEditingContentId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              onApplyContent(
                                selected.id,
                                item.id,
                                editingContentText,
                              )
                            }
                          >
                            Aplicar
                          </button>
                        </article>
                      </>
                    ) : (
                      <article
                        className={`curriculo-content ${
                          item.origen === 'ia' ? 'is-ia' : ''
                        }`}
                        onDoubleClick={() => {
                          if (!puedeEditar) return;
                          onEditingContentId(item.id);
                          onEditingContentText(item.descripcion);
                        }}
                      >
                        {item.descripcion}
                        {puedeEditar && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 mt-2 d-block"
                            onClick={() => {
                              onEditingContentId(item.id);
                              onEditingContentText(item.descripcion);
                            }}
                          >
                            Editar contenido
                          </button>
                        )}
                      </article>
                    )}
                  </article>
                ))
              )}
              {puedeEditar && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => onAddContent(selected.id)}
                >
                  <i className="bi bi-plus-lg me-1" />
                  Agregar contenido
                </button>
              )}
              <h4>Quizzes</h4>
              <p className="text-secondary">
                Sin datos reales en el prototipo.
              </p>
              <h4>Rendimiento</h4>
              <strong>—</strong>
              <small className="d-block text-secondary">
                Promedio disponible al integrar el backend.
              </small>
            </>
          ) : (
            <>
              <h4>
                {selected.tipo === 'materia'
                  ? 'Unidades'
                  : selected.tipo === 'unidad'
                    ? 'Temas'
                    : 'Conceptos'}
              </h4>
              {selected.hijos.length === 0 ? (
                <p className="text-secondary">Sin hijos.</p>
              ) : (
                selected.hijos.map((child) => (
                  <button
                    type="button"
                    className="curriculo-child-link"
                    key={child.id}
                    onClick={() => onSelectChild(child.id)}
                  >
                    <i className={`bi ${nodeIcon(child.tipo)} me-2`} />
                    {child.nombre}
                  </button>
                ))
              )}
            </>
          )}
        </article>
      )}
    </aside>
  );
}
