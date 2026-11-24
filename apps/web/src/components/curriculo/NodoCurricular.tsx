import type { CSSProperties, DragEvent } from 'react';
import type {
  EstadoConcepto,
  NodoCurricular as NodoCurricularData,
  TipoNodoCurricular,
} from '../../types/CurriculoCanvasTypes.ts';

interface Props {
  nodo: NodoCurricularData;
  seleccionado: boolean;
  editable: boolean;
  editing: boolean;
  expanded: boolean;
  estado: EstadoConcepto | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onFinishEdit: (id: string, nombre: string) => void;
  onCancelEdit: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onDrop: (event: DragEvent<HTMLElement>, id: string) => void;
  setRef: (id: string, element: HTMLElement | null) => void;
  depth: number;
  position: {
    x: number;
    y: number;
    width: number;
  };
}

export function nodeIcon(tipo: TipoNodoCurricular): string {
  if (tipo === 'materia') return 'bi-book';
  if (tipo === 'unidad') return 'bi-layers';
  if (tipo === 'tema') return 'bi-diagram-3';
  return 'bi-lightbulb';
}

export default function NodoCurricular({
  nodo,
  seleccionado,
  editable,
  editing,
  expanded,
  estado,
  onSelect,
  onEdit,
  onFinishEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  onDragStart,
  onDrop,
  setRef,
  depth,
  position,
}: Props) {
  const hasChildren = nodo.hijos.length > 0;
  const noGuardado =
    nodo.id.startsWith('TEMP-')
    || nodo.revisionEstado === 'nuevo'
    || nodo.revisionEstado === 'modificado'
    || nodo.revisionEstado === 'pendiente_revision';

  return (
    <article
      ref={(element) => setRef(nodo.id, element)}
      className={[
        'curriculo-node',
        `curriculo-node-${nodo.tipo}`,
        seleccionado ? 'is-selected' : '',
        nodo.origen === 'ia' ? 'is-ia' : '',
        noGuardado ? 'is-unsaved' : '',
        estado ? `state-${estado}` : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--node-depth': depth,
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: position.width,
      } as CSSProperties}
      onClick={() => onSelect(nodo.id)}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (editable) onEdit(nodo.id);
      }}
      draggable={editable && nodo.tipo !== 'materia'}
      onDragStart={(event) => onDragStart(event, nodo.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDrop(event, nodo.id)}
    >
      {nodo.tipo !== 'materia' && editable && (
        <button
          type="button"
          className="curriculo-node-delete"
          aria-label={`Eliminar ${nodo.nombre}`}
          title={`Eliminar ${nodo.nombre}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(nodo.id);
          }}
        >
          <i className="bi bi-x-lg" />
        </button>
      )}
      {editing ? (
        <input
          className="curriculo-name-input"
          defaultValue={nodo.nombre}
          autoFocus
          onBlur={() => onCancelEdit()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onFinishEdit(nodo.id, event.currentTarget.value);
            }
            if (event.key === 'Escape') {
              onCancelEdit();
            }
          }}
        />
      ) : (
        <>
          <i className={`bi ${nodeIcon(nodo.tipo)} curriculo-node-icon`} />
          <span className="curriculo-node-name">{nodo.nombre}</span>
          {hasChildren && nodo.tipo !== 'materia' && (
            <button
              type="button"
              className="curriculo-node-toggle"
              aria-label={expanded ? `Ocultar hijos de ${nodo.nombre}` : `Ver hijos de ${nodo.nombre}`}
              title={expanded ? 'Ocultar hijos' : 'Ver hijos'}
              onClick={(event) => {
                event.stopPropagation();
                onToggle(nodo.id);
              }}
            >
              <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
            </button>
          )}
        </>
      )}
    </article>
  );
}
