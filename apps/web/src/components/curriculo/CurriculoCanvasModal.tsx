import { useEffect, useState } from 'react';
import demoTree from '../../mocks/curriculoDemo.json';
import type {
  EstadoConcepto,
  NodoCurricular,
} from '../../types/CurriculoCanvasTypes.ts';
import CurriculoFuentePanel from './CurriculoFuentePanel.tsx';
import CurriculoDetallePanel from './CurriculoDetallePanel.tsx';
import { type ToastData } from '../common/Toast';
import TaskGeneratingOverlay from '../common/TaskGeneratingOverlay.tsx';
import { cloneCurriculoTree } from './CurriculoCanvasOperations.ts';
import { useCurriculoSources } from './useCurriculoSources.ts';
import { useCurriculoContent } from './useCurriculoContent.ts';
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
import { useCurriculoCanvasState } from './useCurriculoCanvasState.ts';
import CurriculoCanvasEditor from './CurriculoCanvasEditor.tsx';

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
  const canvasState = useCurriculoCanvasState(
    demoTree as unknown as NodoCurricular,
  );
  const {
    tree,
    setTree,
    setSelectedId,
    editingId,
    setEditingId,
    setExpandedIds,
  } = canvasState;
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [baselineTree, setBaselineTree] = useState<NodoCurricular>(() =>
    cloneCurriculoTree(demoTree as unknown as NodoCurricular),
  );
  const sources = useCurriculoSources(grupoId);
  const taskPolling = useCurriculoTaskPolling(grupoId, true);
  const content = useCurriculoContent(setTree, () => setDirty(true));


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
        sources.stopGenerating();
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
      sources.stopGenerating();
      console.error('[curriculo] Generación fallida', {
        tareaId: taskPolling.tareaId,
        estado: taskPolling.status.estado,
        error: taskPolling.status.error,
      });
      const userMessage =
        taskPolling.status.error?.includes('merge')
          ? 'La fuente no agregó información nueva al currículo. Puedes revisar o subir otra fuente.'
          : taskPolling.status.error?.includes('invalid JSON')
            || taskPolling.status.error?.includes('JSON')
            ? 'El modelo no pudo interpretar la fuente. Intenta generar el contenido nuevamente.'
            : 'No se pudo generar el contenido de la fuente. Intenta nuevamente.';
      setToast({
        tipo: 'error',
        mensaje: userMessage,
      });
      void taskPolling.cancel();
    }
  }, [taskPolling.status]);

  if (!open) return null;

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
    setEditingId(null);
    setDirty(false);
  };

  const save = async (): Promise<boolean> => {
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
      sources.stopGenerating();
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
    <CurriculoCanvasEditor
      canvas={canvasState}
      title={grupoNombre}
      subtitle={`${materiaNombre} · ${docenteNombre}`}
      dirty={dirty}
      editable={puedeEditar}
      addDisabled={
        sources.uploading
        || sources.generating
        || taskPolling.status?.estado === 'EN_COLA'
        || taskPolling.status?.estado === 'PROCESANDO'
      }
      leftPanel={
        <CurriculoFuentePanel
          sources={sources.sources}
          puedeEditar={puedeEditar}
          hasNewSource={sources.hasNewSource}
          uploading={sources.uploading}
          uploadError={sources.uploadError}
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
      }
      renderDetail={({ selected, updateName }) => (
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
      )}
      estadoConcepto={estadoConcepto}
      toast={toast}
      onToastChange={setToast}
      onDirty={() => setDirty(true)}
      onClose={onClose}
      onSave={save}
      onDiscard={discardChanges}
    >
      <TaskGeneratingOverlay
        visible={sources.generating
          || taskPolling.status?.estado === 'EN_COLA'
          || taskPolling.status?.estado === 'PROCESANDO'}
        title="Generando contenido curricular"
        subtitle={taskPolling.status?.progreso
          || sources.sourceName
          || 'Fuente nueva'}
        onCancel={taskPolling.tareaId
          ? () => void taskPolling.cancel()
          : undefined}
      />
    </CurriculoCanvasEditor>
  );
}
