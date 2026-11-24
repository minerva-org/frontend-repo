import type { DragEvent } from 'react';
import type { EstadoConcepto } from '../../types/CurriculoCanvasTypes.ts';
import NodoCurricular from './NodoCurricular.tsx';
import type { NodePosition } from './CurriculoCanvasLayout.ts';

interface Props {
  positions: NodePosition[];
  selectedId: string | null;
  editingId: string | null;
  expandedIds: Set<string>;
  editable: boolean;
  estadoConcepto: (id: string) => EstadoConcepto;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onFinishEdit: (id: string, nombre: string) => void;
  onCancelEdit: () => void;
  onToggle: (id: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onDrop: (event: DragEvent<HTMLElement>, id: string) => void;
  setRef: (id: string, element: HTMLElement | null) => void;
}

export default function CurriculoCanvasNodeLayer({
  positions,
  selectedId,
  editingId,
  expandedIds,
  editable,
  estadoConcepto,
  onSelect,
  onEdit,
  onFinishEdit,
  onCancelEdit,
  onToggle,
  onDragStart,
  onDrop,
  setRef,
}: Props) {
  return (
    <>
      {positions.map((position) => (
        <NodoCurricular
          key={position.id}
          nodo={position.node}
          seleccionado={selectedId === position.id}
          editable={editable}
          editing={editingId === position.id}
          expanded={expandedIds.has(position.id)}
          estado={position.node.tipo === 'concepto'
            ? estadoConcepto(position.id)
            : null}
          position={{
            x: position.x,
            y: position.y,
            width: position.width,
          }}
          onSelect={onSelect}
          onEdit={onEdit}
          onFinishEdit={onFinishEdit}
          onCancelEdit={onCancelEdit}
          onToggle={onToggle}
          onDragStart={onDragStart}
          onDrop={onDrop}
          setRef={setRef}
          depth={position.depth}
        />
      ))}
    </>
  );
}
