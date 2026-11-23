import type { DragEvent } from 'react';
import { useState } from 'react';
import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';

interface Props {
  node: NodoCurricular;
  onChangeName: (nombre: string) => void;
  onEmpty: () => void;
  onCancel: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
}

export default function CurriculoDraftNode({
  node,
  onChangeName,
  onEmpty,
  onCancel,
  onDragStart,
}: Props) {
  const [editing, setEditing] = useState(true);
  const icon =
    node.tipo === 'unidad'
      ? 'bi-layers'
      : node.tipo === 'tema'
        ? 'bi-diagram-3'
        : 'bi-lightbulb';

  return (
    <article
      className={`curriculo-draft-node curriculo-node-${node.tipo}`}
      draggable={node.nombre.trim().length > 0}
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart(event);
      }}
      onClick={(event) => event.stopPropagation()}
      onDragOver={(event) => event.preventDefault()}
    >
      <i className={`bi ${icon} me-2`} />
      {editing ? (
        <input
          className="curriculo-name-input"
          defaultValue={node.nombre}
          placeholder={`Nombre de ${node.tipo}`}
          autoFocus
          onChange={(event) => onChangeName(event.currentTarget.value)}
          onBlur={(event) => {
            const name = event.currentTarget.value.trim();
            if (!name) {
              onEmpty();
            } else {
              setEditing(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') onCancel();
          }}
        />
      ) : (
        <span
          className="curriculo-node-name"
          onDoubleClick={() => setEditing(true)}
        >
          {node.nombre}
        </span>
      )}
    </article>
  );
}
