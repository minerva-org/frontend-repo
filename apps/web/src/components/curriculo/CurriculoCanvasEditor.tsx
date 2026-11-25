import { useRef, useState, type ReactNode, type DragEvent } from 'react';
import type { EstadoConcepto, NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';
import Toast, { type ToastData } from '../common/Toast.tsx';
import CurriculoCanvasConnectors from './CurriculoCanvasConnectors.tsx';
import CurriculoCanvasHeader from './CurriculoCanvasHeader.tsx';
import CurriculoCanvasLegend from './CurriculoCanvasLegend.tsx';
import CurriculoCanvasNodeLayer from './CurriculoCanvasNodeLayer.tsx';
import CurriculoDraftNode from './CurriculoDraftNode.tsx';
import CurriculoNodeTypeSelector from './CurriculoNodeTypeSelector.tsx';
import CurriculoZoomControls from './CurriculoZoomControls.tsx';
import CurriculoBackConfirm from './CurriculoBackConfirm.tsx';
import CurriculoDiscardConfirm from './CurriculoDiscardConfirm.tsx';
import CurriculoDeleteConfirm from './CurriculoDeleteConfirm.tsx';
import {
  attachCurriculoDraftNode,
  findCurriculoNode,
  invalidCurriculoAssociationMessage,
  isValidCurriculoDraftDrop,
  isValidCurriculoDrop,
  moveCurriculoNode,
  removeCurriculoNode,
  renameCurriculoNode,
} from './CurriculoCanvasOperations.ts';
import { useCurriculoCanvasPan } from './useCurriculoCanvasPan.ts';
import { useCurriculoDraftNode } from './useCurriculoDraftNode.ts';
import { useCurriculoCanvasState } from './useCurriculoCanvasState.ts';
import '../../styles/CurriculoCanvas.css';

type CanvasState = ReturnType<typeof useCurriculoCanvasState>;

interface DetailContext {
  selected: NodoCurricular | null;
  updateName: (id: string, name: string) => void;
}

interface Props {
  canvas: CanvasState;
  title: string;
  subtitle?: string;
  dirty: boolean;
  editable: boolean;
  addDisabled?: boolean;
  variant?: 'materia' | 'grupo';
  leftPanel: ReactNode;
  renderDetail?: (context: DetailContext) => ReactNode;
  estadoConcepto: (node: NodoCurricular) => EstadoConcepto;
  toast: ToastData | null;
  onToastChange: (toast: ToastData | null) => void;
  onDirty: () => void;
  onClose: () => void;
  onSave: () => boolean | Promise<boolean>;
  onDiscard: () => void;
  onEditMetadata?: () => void;
  children?: ReactNode;
}

function countDescendants(node: NodoCurricular | null): number {
  if (!node) return 0;
  return (node.hijos ?? []).reduce(
    (count, child) => count + 1 + countDescendants(child),
    0,
  );
}

export default function CurriculoCanvasEditor({
  canvas,
  title,
  subtitle,
  dirty,
  editable,
  addDisabled = false,
  variant = 'grupo',
  leftPanel,
  renderDetail,
  estadoConcepto,
  toast,
  onToastChange,
  onDirty,
  onClose,
  onSave,
  onDiscard,
  onEditMetadata,
  children,
}: Props) {
  const {
    tree,
    setTree,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    expandedIds,
    setExpandedIds,
    zoom,
    changeZoom,
    canvasRef,
    canvasLayout,
    toggleExpanded,
  } = canvas;
  const draft = useCurriculoDraftNode();
  const canvasPan = useCurriculoCanvasPan();
  const treeRef = useRef<HTMLElement>(null);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const selected = selectedId ? findCurriculoNode(tree, selectedId) : null;
  const deleteNode = deleteNodeId
    ? findCurriculoNode(tree, deleteNodeId)
    : null;

  const updateName = (nodeId: string, name: string) => {
    if (!name.trim()) return;
    setTree((current) => renameCurriculoNode(
      current,
      nodeId,
      name.trim(),
    ));
    setEditingId(null);
    onDirty();
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId || !editable) return;

    const draggedDraft = draft.draftNode;
    if (draggedDraft && draggedId === draggedDraft.id) {
      const target = findCurriculoNode(tree, targetId);
      if (!target || !isValidCurriculoDraftDrop(draggedDraft, target)) {
        if (target) {
          onToastChange({
            tipo: 'advertencia',
            mensaje: invalidCurriculoAssociationMessage(draggedDraft, target),
          });
        }
        return;
      }
      setTree((current) =>
        attachCurriculoDraftNode(current, draggedDraft, targetId));
      setExpandedIds((current) => {
        const next = new Set(current);
        next.add(targetId);
        next.add(draggedDraft.id);
        return next;
      });
      draft.discard();
      setSelectedId(draggedDraft.id);
      onDirty();
      return;
    }

    const dragged = findCurriculoNode(tree, draggedId);
    const target = findCurriculoNode(tree, targetId);
    if (!dragged || !target) return;
    if (!isValidCurriculoDrop(dragged, target)) {
      onToastChange({
        tipo: 'advertencia',
        mensaje: invalidCurriculoAssociationMessage(dragged, target),
      });
      return;
    }
    setTree((current) => moveCurriculoNode(current, draggedId, targetId));
    setExpandedIds((current) => {
      const next = new Set(current);
      next.add(targetId);
      return next;
    });
    onDirty();
  };

  const requestBack = () => {
    if (!dirty) onClose();
    else setShowBackConfirm(true);
  };

  const discardAndExit = () => {
    draft.discard();
    onDiscard();
    setShowBackConfirm(false);
    onClose();
  };

  const saveAndExit = async () => {
    if (await save()) {
      setShowBackConfirm(false);
      onClose();
    }
  };

  const save = async () => {
    if (draft.draftNode) {
      onToastChange({
        tipo: 'advertencia',
        mensaje:
          'No se puede guardar mientras exista un nodo nuevo sin asociar. '
          + 'Arrastre el nodo a una posición válida o cancele su creación.',
      });
      return false;
    }
    return onSave();
  };

  return (
    <section
      className={`curriculo-modal curriculo-modal-${variant}`}
      role="dialog"
      aria-modal="true"
      aria-label="Editor de currículo"
    >
      <CurriculoCanvasHeader
        title={title}
        subtitle={subtitle}
        dirty={dirty}
        onBack={requestBack}
        onDiscard={() => setShowDiscardConfirm(true)}
        onSave={() => void save()}
        onEditMetadata={onEditMetadata}
      />

      <section
        className={`curriculo-layout${renderDetail ? '' : ' curriculo-layout-no-detail'}`}
      >
        {leftPanel}

        <section className="curriculo-canvas-stage">
          <main
            className="curriculo-canvas"
            ref={canvasRef}
          onWheel={(event) => {
            event.preventDefault();
            changeZoom(zoom * (event.deltaY < 0 ? 1.1 : 0.9));
          }}
          onPointerDown={(event) =>
            canvasPan.onPointerDown(event, canvasRef.current)
          }
          onPointerMove={(event) =>
            canvasPan.onPointerMove(event, canvasRef.current)
          }
          onPointerUp={(event) =>
            canvasPan.onPointerEnd(event, canvasRef.current)
          }
          onPointerCancel={() =>
            canvasPan.onPointerCancel(canvasRef.current)
          }
          onDragOver={(event) =>
            canvasPan.onDragOver(event, canvasRef.current)
          }
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (!target.closest(
              '.curriculo-node, .curriculo-draft-node, .curriculo-canvas-toolbar, .curriculo-legend',
            )) {
              setSelectedId(null);
            }
          }}
          >
            {draft.draftNode && (
              <CurriculoDraftNode
              key={draft.draftNode.id}
              node={draft.draftNode}
              onChangeName={draft.changeName}
              onEmpty={draft.discard}
              onCancel={draft.discard}
              onDragStart={(event) =>
                event.dataTransfer.setData('text/plain', draft.draftNode!.id)
              }
              />
            )}
            <div
              className="curriculo-tree-viewport"
              style={{
                width: canvasLayout.width * zoom,
                height: canvasLayout.height * zoom,
              }}
            >
              <section
                className="curriculo-tree"
                ref={treeRef}
                style={{
                  width: canvasLayout.width,
                  height: canvasLayout.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
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
                  editable={editable}
                  estadoConcepto={(id) => {
                    const node = findCurriculoNode(tree, id);
                    return node ? estadoConcepto(node) : 'sin_contenido';
                  }}
                  onSelect={setSelectedId}
                  onEdit={setEditingId}
                  onFinishEdit={updateName}
                  onCancelEdit={() => setEditingId(null)}
                  onToggle={toggleExpanded}
                  onDragStart={(event, id) =>
                    event.dataTransfer.setData('text/plain', id)
                  }
                  onDrop={handleDrop}
                  onDelete={setDeleteNodeId}
                  setRef={() => undefined}
                />
              </section>
            </div>
          </main>
          <CurriculoNodeTypeSelector
            open={draft.showTypeSelector}
            disabled={!editable || addDisabled || draft.draftNode !== null}
            onToggle={draft.toggleTypeSelector}
            onSelect={draft.selectType}
          />
          <CurriculoZoomControls
            zoom={zoom}
            onChange={changeZoom}
            stopPropagation
          />
          <CurriculoCanvasLegend variant={variant === 'materia' ? 'materia' : undefined} />
        </section>

        {renderDetail?.({ selected, updateName })}
      </section>

      {children}
      <CurriculoBackConfirm
        open={showBackConfirm}
        onSaveAndExit={() => void saveAndExit()}
        onDiscardAndExit={discardAndExit}
        onContinue={() => setShowBackConfirm(false)}
      />
      <CurriculoDiscardConfirm
        open={showDiscardConfirm}
        onConfirm={() => {
          draft.discard();
          onDiscard();
          setShowDiscardConfirm(false);
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
      <CurriculoDeleteConfirm
        open={deleteNode !== null}
        name={deleteNode?.nombre ?? ''}
        descendants={countDescendants(deleteNode)}
        onConfirm={() => {
          if (!deleteNodeId) return;
          setTree((current) => removeCurriculoNode(current, deleteNodeId));
          setSelectedId((current) =>
            current === deleteNodeId ? null : current);
          setEditingId(null);
          onDirty();
          setDeleteNodeId(null);
        }}
        onCancel={() => setDeleteNodeId(null)}
      />
      <Toast toast={toast} onCerrar={() => onToastChange(null)} />
    </section>
  );
}
