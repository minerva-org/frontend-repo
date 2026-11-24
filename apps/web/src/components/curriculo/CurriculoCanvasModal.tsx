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
import CurriculoFuentePanel from './CurriculoFuentePanel.tsx';
import CurriculoDetallePanel from './CurriculoDetallePanel.tsx';
import Toast, { type ToastData } from '../common/Toast';
import {
  attachCurriculoDraftNode,
  cloneCurriculoTree,
  findCurriculoNode,
  invalidCurriculoAssociationMessage,
  isValidCurriculoDraftDrop,
  isValidCurriculoDrop,
  moveCurriculoNode,
  renameCurriculoNode,
} from './CurriculoCanvasOperations.ts';
import { useCurriculoCanvasPan } from './useCurriculoCanvasPan.ts';
import { useCurriculoDraftNode } from './useCurriculoDraftNode.ts';
import { useCurriculoSources } from './useCurriculoSources.ts';
import { useCurriculoContent } from './useCurriculoContent.ts';
import CurriculoCanvasHeader from './CurriculoCanvasHeader.tsx';
import CurriculoCanvasLegend from './CurriculoCanvasLegend.tsx';
import CurriculoBackConfirm from './CurriculoBackConfirm.tsx';
import CurriculoDiscardConfirm from './CurriculoDiscardConfirm.tsx';
import {
  getCurriculo,
  putCurriculo,
  curriculoBackendToNode,
} from '../../services/CurriculoService';
import {
  createCurriculumTask,
  type CurriculumGenerationRequest,
} from '../../services/CurriculoIaService';
import { useCurriculoTaskPolling } from './useCurriculoTaskPolling';
import '../../styles/CurriculoCanvas.css';

interface Props {
  open: boolean;
  grupoId: string;
  grupoNombre: string;
  materiaNombre: string;
  docenteNombre: string;
  puedeEditar: boolean;
  onClose: () => void;
}


function estadoConcepto(node: NodoCurricular): EstadoConcepto {
  return node.estadoConcepto ?? (node.contenido.length ? 'con_contenido' : 'sin_contenido');
}

export default function CurriculoCanvasModal({
  open,
  grupoId,
  grupoNombre,
  materiaNombre,
  docenteNombre,
  puedeEditar,
  onClose,
}: Props) {
  const [tree, setTree] = useState<NodoCurricular>(() =>
    cloneCurriculoTree(demoTree as unknown as NodoCurricular),
  );
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
  const [toast, setToast] = useState<ToastData | null>(null);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [baselineTree, setBaselineTree] = useState<NodoCurricular>(() =>
    cloneCurriculoTree(demoTree as unknown as NodoCurricular),
  );
  const canvasRef = useRef<HTMLElement>(null);
  const treeRef = useRef<HTMLElement>(null);
  const canvasPan = useCurriculoCanvasPan();
  const draft = useCurriculoDraftNode();
  const sources = useCurriculoSources(grupoId);
  const taskPolling = useCurriculoTaskPolling(grupoId, true);
  const content = useCurriculoContent(setTree, () => setDirty(true));

  const selected = useMemo(
    () => selectedId ? findCurriculoNode(tree, selectedId) : null,
    [tree, selectedId],
  );
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getCurriculo(grupoId)
      .then((curriculo) => {
        if (cancelled) return;
        if (curriculo.unidades.length > 0) {
          const realTree = curriculoBackendToNode(
            curriculo,
            materiaNombre,
          );
          const baseline = cloneCurriculoTree(realTree);
          setBaselineTree(baseline);
          setTree(realTree);
          setSelectedId(realTree.id);
          const expanded = new Set<string>();
          const collect = (node: NodoCurricular) => {
            expanded.add(node.id);
            (node.hijos ?? []).forEach(collect);
          };
          collect(realTree);
          setExpandedIds(expanded);
          setDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToast({
            tipo: 'advertencia',
            mensaje: 'No se pudo cargar el currículo real. Se muestra el prototipo local.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [grupoId, materiaNombre, open]);

  useEffect(() => {
    if (!taskPolling.status) return;
    if (taskPolling.status.estado === 'COMPLETADA') {
      const resultado = taskPolling.status.resultado as
        | {
            arbol?: unknown;
            errores?: Array<{ mensaje?: string }>;
          }
        | null;
      const generationError = resultado?.errores?.find(
        (item) => typeof item.mensaje === 'string' && item.mensaje.trim(),
      )?.mensaje;
      if (generationError) {
        setToast({
          tipo: 'error',
          mensaje: generationError,
        });
        void taskPolling.cancel();
        return;
      }
      if (resultado?.arbol && typeof resultado.arbol === 'object') {
        setTree(cloneCurriculoTree(resultado.arbol as NodoCurricular));
        setDirty(true);
        sources.markNewSourcesProcessed();
        setToast({
          tipo: 'exito',
          mensaje: 'El árbol se alimentó con las fuentes nuevas. Revisa los cambios antes de Guardar.',
        });
      }
      void taskPolling.cancel();
    }
    if (taskPolling.status.estado === 'ERROR') {
      console.error('[curriculo] Generación fallida', {
        tareaId: taskPolling.tareaId,
        estado: taskPolling.status.estado,
        error: taskPolling.status.error,
      });
      setToast({
        tipo: 'error',
        mensaje: taskPolling.status.error
          || 'La generación terminó con un error.',
      });
    }
  }, [taskPolling.status]);

  if (!open) return null;

  const updateName = (nodeId: string, name: string) => {
    if (!name.trim()) return;
    setTree((current) => renameCurriculoNode(current, nodeId, name.trim()));
    setEditingId(null);
    setDirty(true);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, nodeId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === nodeId || !puedeEditar) return;

    const draggedDraft = draft.draftNode;
    if (draggedDraft && draggedId === draggedDraft.id) {
      const target = findCurriculoNode(tree, nodeId);
      if (!target || !isValidCurriculoDraftDrop(draggedDraft, target)) {
        if (target) {
          setToast({
            tipo: 'advertencia',
            mensaje: invalidCurriculoAssociationMessage(draggedDraft, target),
          });
        }
        return;
      }

      setTree((current) =>
        attachCurriculoDraftNode(current, draggedDraft, nodeId),
      );
      setExpandedIds((current) => {
        const next = new Set(current);
        next.add(nodeId);
        next.add(draggedDraft.id);
        return next;
      });
      draft.discard();
      setDirty(true);
      setSelectedId(draggedDraft.id);
      return;
    }

    const dragged = findCurriculoNode(tree, draggedId);
    const target = findCurriculoNode(tree, nodeId);
    if (!dragged || !target) return;
    if (!isValidCurriculoDrop(dragged, target)) {
      setToast({
        tipo: 'advertencia',
        mensaje: invalidCurriculoAssociationMessage(dragged, target),
      });
      return;
    }
    setTree((current) =>
      moveCurriculoNode(current, draggedId, nodeId),
    );
    setExpandedIds((current) => {
      const next = new Set(current);
      next.add(nodeId);
      return next;
    });
    setDirty(true);
  };


  const handleBack = () => {
    if (!dirty) {
      onClose();
      return;
    }
    setShowBackConfirm(true);
  };

  const discardAndExit = () => {
    setShowBackConfirm(false);
    setShowDiscardConfirm(false);
    setTree(cloneCurriculoTree(baselineTree));
    draft.discard();
    setDirty(false);
    onClose();
  };

  const discardChanges = () => {
    const restored = cloneCurriculoTree(baselineTree);
    setTree(restored);
    setSelectedId(restored.id);
    const expanded = new Set<string>();
    const collect = (node: NodoCurricular) => {
      expanded.add(node.id);
      (node.hijos ?? []).forEach(collect);
    };
    collect(restored);
    setExpandedIds(expanded);
    draft.discard();
    setEditingId(null);
    setDirty(false);
    setShowDiscardConfirm(false);
  };

  const save = async (): Promise<boolean> => {
    if (draft.draftNode) {
      setToast({
        tipo: 'advertencia',
        mensaje:
          'No se puede guardar mientras exista un nodo nuevo sin asociar. '
          + 'Arrastre el nodo a una posición válida o cancele su creación.',
      });
      return false;
    }
    try {
      const persisted = await putCurriculo(grupoId, tree);
      const persistedTree = curriculoBackendToNode(
        persisted,
        materiaNombre,
      );
      const persistedBaseline = cloneCurriculoTree(persistedTree);
      setBaselineTree(persistedBaseline);
      setTree(persistedTree);
      setSelectedId(persistedTree.id);
      const expanded = new Set<string>();
      const collect = (node: NodoCurricular) => {
        expanded.add(node.id);
        (node.hijos ?? []).forEach(collect);
      };
      collect(persistedTree);
      setExpandedIds(expanded);
      setEditingId(null);
      setDirty(false);
      setToast({
        tipo: 'exito',
        mensaje: 'Currículo guardado correctamente.',
      });
      return true;
    } catch {
      setToast({
        tipo: 'error',
        mensaje: 'No se pudo guardar el currículo. Los cambios locales siguen pendientes.',
      });
      return false;
    }
  };

  const generateFromSources = async () => {
    if (sources.newFiles.length === 0) return;
    sources.generate();
    try {
      const archivos = await Promise.all(
        sources.newFiles.map(async (entry) => {
          const buffer = await entry.file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
          });
          return {
            nombre: entry.nombre,
            contenidoBase64: window.btoa(binary),
          };
        }),
      );

      const request: CurriculumGenerationRequest = {
        grupoId,
        materiaNombre,
        arbol: tree,
        fuentes: sources.newFiles.map((entry) => ({
          documentoId: entry.documentoId,
          checksumSha256: entry.checksumSha256,
          nombre: entry.nombre,
        })),
        fuentesProcesadas: [],
        modoFusion: 'conservadora',
        archivos,
      };

      const tareaId = await createCurriculumTask(grupoId, request);
      taskPolling.start(tareaId);
    } catch (caught) {
      setToast({
        tipo: 'error',
        mensaje:
          caught instanceof Error
            ? caught.message
            : 'No se pudo iniciar la generación de contenido.',
      });
    }
  };

  return (
    <section className="curriculo-modal" role="dialog" aria-modal="true" aria-label="Árbol curricular">
      <CurriculoCanvasHeader
        grupoNombre={grupoNombre}
        materiaNombre={materiaNombre}
        docenteNombre={docenteNombre}
        dirty={dirty}
        onBack={handleBack}
        onDiscard={() => setShowDiscardConfirm(true)}
        onSave={save}
      />

      <section className="curriculo-layout">
        <CurriculoNodeTypeSelector
          open={draft.showTypeSelector}
          disabled={!puedeEditar}
          onToggle={() =>
            draft.toggleTypeSelector()
          }
          onSelect={(tipo) => {
            draft.selectType(tipo);
            setDirty(true);
          }}
        />
        <CurriculoFuentePanel
          sources={sources.sources}
          puedeEditar={puedeEditar}
          hasNewSource={sources.hasNewSource}
          generating={
            sources.generating
            || taskPolling.status?.estado === 'EN_COLA'
            || taskPolling.status?.estado === 'PROCESANDO'
          }
          fileInputRef={sources.fileInputRef}
          onAddSource={sources.addSource}
          onGenerate={generateFromSources}
          onOpenFilePicker={sources.openFilePicker}
          onRemoveSource={sources.removeSource}
        />

        <main
          className="curriculo-canvas"
          ref={canvasRef}
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
            if (!target.closest('.curriculo-node, .curriculo-canvas-toolbar, .curriculo-legend')) {
              setSelectedId(null);
            }
          }}
        >
          {draft.draftNode && (
            <CurriculoDraftNode
              node={draft.draftNode}
              onChangeName={draft.changeName}
              onEmpty={draft.discard}
              onCancel={draft.discard}
              onDragStart={(event) =>
                event.dataTransfer.setData('text/plain', draft.draftNode!.id)
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
                const node = findCurriculoNode(tree, id);
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
          <CurriculoCanvasLegend />
        </main>

        <CurriculoDetallePanel
          selected={selected}
          puedeEditar={puedeEditar}
          editingId={editingId}
          editingContentId={content.editingContentId}
          editingContentText={content.editingContentText}
          estadoConcepto={estadoConcepto}
          onEditingId={setEditingId}
          onFinishName={updateName}
          onSelectChild={setSelectedId}
          onEditingContentId={content.setEditingContentId}
          onEditingContentText={content.setEditingContentText}
          onApplyContent={content.updateContent}
          onAddContent={content.addContent}
        />
      </section>

      {(sources.generating
        || taskPolling.status?.estado === 'EN_COLA'
        || taskPolling.status?.estado === 'PROCESANDO') && (
        <section className="curriculo-generating">
          <article>
            <span className="spinner-border" role="status" />
            <strong>Generando contenido curricular</strong>
            <small>
              {taskPolling.status?.progreso
                || sources.sourceName
                || 'Fuente nueva'}
            </small>
            {taskPolling.tareaId && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => void taskPolling.cancel()}
              >
                <i className="bi bi-x-lg me-1" />
                Cancelar
              </button>
            )}
          </article>
        </section>
      )}
      <CurriculoBackConfirm
        open={showBackConfirm}
        onSaveAndExit={async () => {
          if (await save()) {
            setShowBackConfirm(false);
            onClose();
          }
        }}
        onDiscardAndExit={discardAndExit}
        onContinue={() => setShowBackConfirm(false)}
      />
      <CurriculoDiscardConfirm
        open={showDiscardConfirm}
        onConfirm={discardChanges}
        onCancel={() => setShowDiscardConfirm(false)}
      />
      <Toast toast={toast} onCerrar={() => setToast(null)} />
    </section>
  );
}
