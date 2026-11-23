import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import demoTree from '../../mocks/curriculoDemo.json';
import type {
  EstadoConcepto,
  NodoCurricular,
} from '../../types/CurriculoCanvasTypes.ts';
import { calculateCurriculoCanvasLayout } from './CurriculoCanvasLayout.ts';
import CurriculoCanvasNodeLayer from './CurriculoCanvasNodeLayer.tsx';
import CurriculoCanvasConnectors from './CurriculoCanvasConnectors.tsx';
import CurriculoDraftNode from './CurriculoDraftNode.tsx';
import CurriculoNodeTypeSelector from './CurriculoNodeTypeSelector.tsx';
import CurriculoFuentePanel, {
  type CurriculoSourceEntry,
} from './CurriculoFuentePanel.tsx';
import CurriculoDetallePanel from './CurriculoDetallePanel.tsx';
import Toast, { type ToastData } from '../common/Toast';
import '../../styles/CurriculoCanvas.css';

interface Props {
  open: boolean;
  grupoNombre: string;
  materiaNombre: string;
  docenteNombre: string;
  puedeEditar: boolean;
  onClose: () => void;
}

function cloneTree(node: NodoCurricular): NodoCurricular {
  return {
    ...node,
    contenido: (node.contenido ?? []).map((item) => ({ ...item })),
    hijos: (node.hijos ?? []).map(cloneTree),
  };
}

function findNode(node: NodoCurricular, id: string): NodoCurricular | null {
  if (node.id === id) return node;
  for (const child of node.hijos) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function renameNode(node: NodoCurricular, id: string, nombre: string): NodoCurricular {
  if (node.id === id) return { ...node, nombre, revisionEstado: 'modificado' };
  return { ...node, hijos: node.hijos.map((child) => renameNode(child, id, nombre)) };
}

function moveNode(tree: NodoCurricular, nodeId: string, parentId: string): NodoCurricular {
  let moved: NodoCurricular | null = null;

  const remove = (node: NodoCurricular): NodoCurricular => ({
    ...node,
    hijos: node.hijos.filter((child) => {
      if (child.id === nodeId) {
        moved = cloneTree(child);
        return false;
      }
      return true;
    }).map(remove),
  });

  const withoutMoved = remove(cloneTree(tree));
  if (!moved) return tree;

  const add = (node: NodoCurricular): NodoCurricular => ({
    ...node,
    hijos: node.id === parentId
      ? [...node.hijos, moved as NodoCurricular]
      : node.hijos.map(add),
  });

  return add(withoutMoved);
}

function isDescendant(
  node: NodoCurricular,
  possibleDescendantId: string,
): boolean {
  return node.hijos.some((child) =>
    child.id === possibleDescendantId
      ? true
      : isDescendant(child, possibleDescendantId),
  );
}

function isValidDrop(
  dragged: NodoCurricular,
  target: NodoCurricular,
): boolean {
  if (dragged.id === target.id) return false;
  if (isDescendant(dragged, target.id)) return false;

  if (dragged.tipo === 'concepto') {
    return false;
  }
  if (dragged.tipo === 'tema') {
    return target.tipo === 'unidad';
  }
  if (dragged.tipo === 'unidad') {
    return target.tipo === 'materia';
  }
  if (dragged.tipo === 'materia') {
    return false;
  }
  return false;
}

function isValidDraftDrop(
  draft: NodoCurricular,
  target: NodoCurricular,
): boolean {
  if (draft.tipo === 'concepto') return target.tipo === 'tema';
  if (draft.tipo === 'tema') return target.tipo === 'unidad';
  if (draft.tipo === 'unidad') return target.tipo === 'materia';
  return false;
}

function createDraftNode(tipo: NodoCurricular['tipo']): NodoCurricular {
  return {
    id: `TEMP-${crypto.randomUUID()}`,
    tipo,
    nombre: '',
    origen: 'usuario',
    revisionEstado: 'nuevo',
    estadoConcepto: tipo === 'concepto' ? 'sin_contenido' : undefined,
    contenido: [],
    hijos: [],
  };
}

function invalidAssociationMessage(
  dragged: NodoCurricular,
  target: NodoCurricular,
) {
  if (dragged.tipo === 'concepto') {
    return 'Los conceptos no aceptan asociaciones. Un concepto solo puede permanecer bajo un tema.';
  }
  if (dragged.tipo === 'tema') {
    return 'Un tema solo puede asociarse a una unidad. No puede colocarse directamente bajo materia o concepto.';
  }
  if (dragged.tipo === 'unidad') {
    return 'Una unidad solo puede asociarse a la materia.';
  }
  return `El nodo ${dragged.nombre || dragged.tipo} no puede asociarse a ${target.nombre || target.tipo}.`;
}

function attachDraftNode(
  tree: NodoCurricular,
  draft: NodoCurricular,
  parentId: string,
): NodoCurricular {
  if (tree.id === parentId) {
    return {
      ...tree,
      hijos: [...(tree.hijos ?? []), cloneTree(draft)],
    };
  }
  return {
    ...tree,
    hijos: (tree.hijos ?? []).map((child) =>
      attachDraftNode(child, draft, parentId),
    ),
  };
}

function estadoConcepto(node: NodoCurricular): EstadoConcepto {
  return node.estadoConcepto ?? (node.contenido.length ? 'con_contenido' : 'sin_contenido');
}

export default function CurriculoCanvasModal({
  open,
  grupoNombre,
  materiaNombre,
  docenteNombre,
  puedeEditar,
  onClose,
}: Props) {
  const [tree, setTree] = useState<NodoCurricular>(() => cloneTree(demoTree as unknown as NodoCurricular));
  const [selectedId, setSelectedId] = useState<string | null>(demoTree.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collect = (node: NodoCurricular) => {
      ids.add(node.id);
      (node.hijos ?? []).forEach(collect);
    };
    collect(demoTree as unknown as NodoCurricular);
    return ids;
  });
  const [sourceEntries, setSourceEntries] = useState<CurriculoSourceEntry[]>([
    { id: 'demo-book', name: 'book.pdf', status: 'disponible' },
  ]);
  const [generating, setGenerating] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingContentText, setEditingContentText] = useState('');
  const [showNodeTypeSelector, setShowNodeTypeSelector] = useState(false);
  const [draftNode, setDraftNode] = useState<NodoCurricular | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const treeRef = useRef<HTMLElement>(null);
  const panRef = useRef({ active: false, x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const dragAutoPanRef = useRef<number | null>(null);

  const selected = useMemo(
    () => selectedId ? findNode(tree, selectedId) : null,
    [tree, selectedId],
  );
  const hasNewSource = sourceEntries.some((source) => source.status === 'nueva');
  const canvasLayout = useMemo(
    () => calculateCurriculoCanvasLayout(tree, expandedIds),
    [tree, expandedIds],
  );

  useEffect(() => {
    if (!open || !canvasRef.current || canvasLayout.centeringNodes.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const left = Math.min(
        ...canvasLayout.centeringNodes.map((node) => node.x),
      );
      const right = Math.max(
        ...canvasLayout.centeringNodes.map((node) => node.x + node.width),
      );
      const visibleCenter = (left + right) / 2;
      canvas.scrollLeft = visibleCenter - canvas.clientWidth / 2;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, canvasLayout]);

  if (!open) return null;

  const updateName = (nodeId: string, name: string) => {
    if (!name.trim()) return;
    setTree((current) => renameNode(current, nodeId, name.trim()));
    setEditingId(null);
    setDirty(true);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, nodeId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === nodeId || !puedeEditar) return;

    if (draftNode && draggedId === draftNode.id) {
      const target = findNode(tree, nodeId);
      if (!target || !isValidDraftDrop(draftNode, target)) {
        if (target) {
          setToast({
            tipo: 'advertencia',
            mensaje: invalidAssociationMessage(draftNode, target),
          });
        }
        return;
      }

      setTree((current) => attachDraftNode(current, draftNode, nodeId));
      setDraftNode(null);
      setDirty(true);
      setSelectedId(draftNode.id);
      return;
    }

    const dragged = findNode(tree, draggedId);
    const target = findNode(tree, nodeId);
    if (!dragged || !target) return;
    if (!isValidDrop(dragged, target)) {
      setToast({
        tipo: 'advertencia',
        mensaje: invalidAssociationMessage(dragged, target),
      });
      return;
    }
    setTree((current) => moveNode(current, draggedId, nodeId));
    setDirty(true);
  };

  const addSource = (file?: File) => {
    if (!file) return;
    setSourceName(file.name);
    setSourceEntries((current) => [
      ...current,
      { id: crypto.randomUUID(), name: file.name, status: 'nueva' },
    ]);
  };

  const generate = () => {
    if (!hasNewSource) return;
    setGenerating(true);
    window.setTimeout(() => setGenerating(false), 900);
  };

  const handleBack = () => {
    if (!dirty || window.confirm('Hay cambios sin guardar. ¿Quieres salir y descartar los cambios?')) onClose();
  };

  const save = () => {
    if (draftNode) {
      setToast({
        tipo: 'advertencia',
        mensaje:
          'No se puede guardar mientras exista un nodo nuevo sin asociar. '
          + 'Arrastre el nodo a una posición válida o cancele su creación.',
      });
      return;
    }
    const json = JSON.stringify(tree, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curriculo-${grupoNombre || 'grupo'}-prototipo.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDirty(false);
  };

  const updateConceptContent = (
    conceptoId: string,
    contenidoId: string,
    descripcion: string,
  ) => {
    if (!descripcion.trim()) return;
    setTree((current) => {
      const replaceContent = (node: NodoCurricular): NodoCurricular => {
        if (node.id === conceptoId) {
          return {
            ...node,
            revisionEstado: 'modificado',
            estadoConcepto: 'con_contenido',
            contenido: node.contenido.map((item) =>
              item.id === contenidoId
                ? {
                    ...item,
                    descripcion: descripcion.trim(),
                    revisionEstado: 'modificado',
                  }
                : item,
            ),
          };
        }
        return {
          ...node,
          hijos: node.hijos.map(replaceContent),
        };
      };
      return replaceContent(current);
    });
    setEditingContentId(null);
    setEditingContentText('');
    setDirty(true);
  };

  const addConceptContent = (conceptoId: string) => {
    setTree((current) => {
      const addContent = (node: NodoCurricular): NodoCurricular => {
        if (node.id === conceptoId) {
          return {
            ...node,
            revisionEstado: 'modificado',
            estadoConcepto: 'con_contenido',
            contenido: [
              ...node.contenido,
              {
                id: `TEMP-CTG-${crypto.randomUUID()}`,
                descripcion: 'Nuevo contenido curricular',
                origen: 'usuario',
                revisionEstado: 'nuevo',
              },
            ],
          };
        }
        return {
          ...node,
          hijos: node.hijos.map(addContent),
        };
      };
      return addContent(current);
    });
    setDirty(true);
  };


  return (
    <section className="curriculo-modal" role="dialog" aria-modal="true" aria-label="Árbol curricular">
      <header className="curriculo-header">
        <article className="curriculo-header-left">
          <button type="button" className="btn btn-outline-secondary curriculo-back" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2" />
            Volver
          </button>
          <article>
            <strong>{grupoNombre}</strong>
            <small>{materiaNombre} · {docenteNombre}</small>
          </article>
        </article>
        <article className="curriculo-header-actions">
          {dirty && <span className="curriculo-dirty">Cambios sin guardar</span>}
          <button type="button" className="btn btn-outline-secondary" onClick={handleBack} disabled={!dirty}>Descartar</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty}>Guardar</button>
        </article>
      </header>

      <section className="curriculo-layout">
        <CurriculoNodeTypeSelector
          open={showNodeTypeSelector}
          disabled={!puedeEditar}
          onToggle={() =>
            setShowNodeTypeSelector((current) => !current)
          }
          onSelect={(tipo) => {
            setDraftNode(createDraftNode(tipo));
            setShowNodeTypeSelector(false);
            setDirty(true);
          }}
        />
        <CurriculoFuentePanel
          sources={sourceEntries}
          puedeEditar={puedeEditar}
          hasNewSource={hasNewSource}
          generating={generating}
          fileInputRef={fileInputRef}
          onAddSource={addSource}
          onGenerate={generate}
          onOpenFilePicker={() => fileInputRef.current?.click()}
        />

        <main
          className="curriculo-canvas"
          ref={canvasRef}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('.curriculo-node, .curriculo-draft-node, .curriculo-canvas-toolbar, .curriculo-legend')) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            event.preventDefault();
            panRef.current = {
              active: true,
              x: event.clientX,
              y: event.clientY,
              scrollLeft: canvas.scrollLeft,
              scrollTop: canvas.scrollTop,
            };
            canvas.setPointerCapture(event.pointerId);
            canvas.classList.add('is-panning');
          }}
          onPointerMove={(event) => {
            const pan = panRef.current;
            const canvas = canvasRef.current;
            if (!pan.active || !canvas) return;
            canvas.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
            canvas.scrollTop = pan.scrollTop - (event.clientY - pan.y);
          }}
          onPointerUp={(event) => {
            panRef.current.active = false;
            canvasRef.current?.classList.remove('is-panning');
            if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
              canvasRef.current.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => {
            panRef.current.active = false;
            canvasRef.current?.classList.remove('is-panning');
          }}
          onDragOver={(event) => {
            event.preventDefault();
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const edge = 64;
            if (event.clientX - rect.left < edge) {
              canvas.scrollLeft -= 18;
            } else if (rect.right - event.clientX < edge) {
              canvas.scrollLeft += 18;
            }
            if (event.clientY - rect.top < edge) {
              canvas.scrollTop -= 18;
            } else if (rect.bottom - event.clientY < edge) {
              canvas.scrollTop += 18;
            }
          }}
          onDragEnd={() => {
            if (dragAutoPanRef.current !== null) {
              window.cancelAnimationFrame(dragAutoPanRef.current);
              dragAutoPanRef.current = null;
            }
          }}
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.curriculo-node, .curriculo-canvas-toolbar, .curriculo-legend')) {
              setSelectedId(null);
            }
          }}
        >
          {draftNode && (
            <CurriculoDraftNode
              node={draftNode}
              onChangeName={(nombre) =>
                setDraftNode((current) =>
                  current ? { ...current, nombre } : current,
                )
              }
              onEmpty={() => setDraftNode(null)}
              onCancel={() => setDraftNode(null)}
              onDragStart={(event) =>
                event.dataTransfer.setData('text/plain', draftNode.id)
              }
            />
          )}
          <section
            className="curriculo-tree"
            ref={treeRef}
            style={{
              width: canvasLayout.width,
              height: canvasLayout.height,
              padding: 0,
            }}
          >
            <CurriculoCanvasConnectors
              connectors={canvasLayout.connectors}
              width={canvasLayout.width}
              height={canvasLayout.height}
            />
            <CurriculoCanvasNodeLayer
              positions={canvasLayout.nodes}
              selectedId={selectedId}
              editingId={editingId}
              expandedIds={expandedIds}
              editable={puedeEditar}
              estadoConcepto={(id) => {
                const node = findNode(tree, id);
                return node ? estadoConcepto(node) : 'sin_contenido';
              }}
              onSelect={setSelectedId}
              onEdit={setEditingId}
              onFinishEdit={updateName}
              onCancelEdit={() => setEditingId(null)}
              onToggle={(id) => {
                setExpandedIds((current) => {
                  const next = new Set(current);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              onDragStart={(event, id) => event.dataTransfer.setData('text/plain', id)}
              onDrop={handleDrop}
              setRef={() => undefined}
            />
          </section>
          <section className="curriculo-legend">
            <strong>Leyenda</strong>
            <span><i className="bi bi-book" /> Materia</span>
            <span><i className="bi bi-layers" /> Unidad</span>
            <span><i className="bi bi-diagram-3" /> Tema</span>
            <span><i className="bi bi-lightbulb" /> Concepto</span>
            <span><i className="legend-outline state-unsaved" /> Cambios sin guardar</span>
            <span><i className="legend-dot state-visto" /> Visto</span>
            <span><i className="legend-dot state-planeado" /> Planeado</span>
            <span><i className="legend-dot state-con_contenido" /> Con contenido</span>
            <span><i className="legend-dot state-sin_contenido" /> Sin contenido</span>
            <small>Los conceptos grises no se consideran en la generación automática de Quiz.</small>
          </section>
        </main>

        <CurriculoDetallePanel
          selected={selected}
          puedeEditar={puedeEditar}
          editingId={editingId}
          editingContentId={editingContentId}
          editingContentText={editingContentText}
          estadoConcepto={estadoConcepto}
          onEditingId={setEditingId}
          onFinishName={updateName}
          onSelectChild={setSelectedId}
          onEditingContentId={setEditingContentId}
          onEditingContentText={setEditingContentText}
          onApplyContent={updateConceptContent}
          onAddContent={addConceptContent}
        />
      </section>

      {generating && (
        <section className="curriculo-generating">
          <article>
            <span className="spinner-border" role="status" />
            <strong>Generando contenido curricular</strong>
            <small>{sourceName || 'Fuente nueva'}</small>
          </article>
        </section>
      )}
      <Toast toast={toast} onCerrar={() => setToast(null)} />
    </section>
  );
}
