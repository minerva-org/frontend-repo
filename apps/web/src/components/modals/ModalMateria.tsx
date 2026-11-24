import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import type { Materia } from '../../types/types.ts';
import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';
import {
  extraerConceptosMateria,
  materiaExtraccionErrorMessage,
  materiaDocumentoErrorMessage,
} from '../../services/materiaDocumentoService.ts';
import {
  attachCurriculoDraftNode,
  cloneCurriculoTree,
  findCurriculoNode,
  invalidCurriculoAssociationMessage,
  isValidCurriculoDraftDrop,
  isValidCurriculoDrop,
  moveCurriculoNode,
  renameCurriculoNode,
} from '../curriculo/CurriculoCanvasOperations.ts';
import CurriculoCanvasNodeLayer from '../curriculo/CurriculoCanvasNodeLayer.tsx';
import CurriculoCanvasConnectors from '../curriculo/CurriculoCanvasConnectors.tsx';
import CurriculoDraftNode from '../curriculo/CurriculoDraftNode.tsx';
import CurriculoNodeTypeSelector from '../curriculo/CurriculoNodeTypeSelector.tsx';
import { useCurriculoDraftNode } from '../curriculo/useCurriculoDraftNode.ts';
import { useCurriculoCanvasPan } from '../curriculo/useCurriculoCanvasPan.ts';
import CurriculoCanvasLegend from '../curriculo/CurriculoCanvasLegend.tsx';
import CurriculoZoomControls from '../curriculo/CurriculoZoomControls.tsx';
import CurriculoBackConfirm from '../curriculo/CurriculoBackConfirm.tsx';
import CurriculoDiscardConfirm from '../curriculo/CurriculoDiscardConfirm.tsx';
import CurriculoCanvasHeader from '../curriculo/CurriculoCanvasHeader.tsx';
import { useCurriculoCanvasState } from '../curriculo/useCurriculoCanvasState.ts';
import MateriaMetadataModal from './MateriaMetadataModal.tsx';
import MateriaPlanPanel from './MateriaPlanPanel.tsx';
import CurriculoDeleteConfirm from '../curriculo/CurriculoDeleteConfirm.tsx';
import { removeCurriculoNode } from '../curriculo/CurriculoCanvasOperations.ts';
import TaskGeneratingOverlay from '../common/TaskGeneratingOverlay.tsx';
import '../../styles/ModalMateria.css';
import '../../styles/CurriculoCanvas.css';

export interface ConceptoForm {
  id: string;
  nombre: string;
}

export interface TemaForm {
  id: string;
  nombre: string;
  conceptos: ConceptoForm[];
}

export interface UnidadForm {
  id: string;
  nombre: string;
  temas: TemaForm[];
}

export interface DatosMateria {
  id: string;
  nombre: string;
  prefijo: string;
  planEstudioId: string;
  unidades: UnidadForm[];
  archivo: File | null;
  archivoExistenteId: string | null;
  archivoEliminado: boolean;
}

interface Props {
  materia?: Materia | null;
  onCerrar: () => void;
  onGuardar: (datos: DatosMateria) => Promise<void>;
}

function derivarPrefijo(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase();
}

function extraerNumeroDesdePrefijo(prefijo?: string): number {
  const match = prefijo?.match(/(\d)$/);
  const numero = match ? Number(match[1]) : 1;
  return Number.isFinite(numero) && numero >= 1 && numero <= 9 ? numero : 1;
}

function buildTree(materia: Materia | null | undefined): NodoCurricular {
  const materiaId = materia?.id ?? `MAT-${crypto.randomUUID()}`;
  return {
    id: materiaId,
    tipo: 'materia',
    nombre: materia?.nombre ?? '',
    origen: 'materia',
    revisionEstado: 'original',
    contenido: [],
    hijos: (materia?.unidades ?? []).map((unidad) => ({
      id: unidad.id ?? crypto.randomUUID(),
      tipo: 'unidad',
      nombre: unidad.nombre ?? '',
      origen: 'materia',
      revisionEstado: 'original',
      contenido: [],
      hijos: (unidad.temas ?? []).map((tema) => ({
        id: tema.id ?? crypto.randomUUID(),
        tipo: 'tema',
        nombre: tema.nombre ?? '',
        origen: 'materia',
        revisionEstado: 'original',
        contenido: [],
        hijos: (tema.conceptos ?? []).map((concepto) => ({
          id: concepto.id ?? crypto.randomUUID(),
          tipo: 'concepto',
          nombre: concepto.nombre ?? '',
          origen: 'materia',
          revisionEstado: 'original',
          estadoConcepto: 'sin_contenido',
          contenido: [],
          hijos: [],
        })),
      })),
    })),
  };
}

function treeToUnits(tree: NodoCurricular): UnidadForm[] {
  return (tree.hijos ?? [])
    .filter((unidad) => unidad.tipo === 'unidad')
    .filter((unidad) => unidad.nombre.trim())
    .map((unidad) => ({
      id: unidad.id,
      nombre: unidad.nombre.trim(),
      temas: (unidad.hijos ?? [])
        .filter((tema) => tema.tipo === 'tema')
        .filter((tema) => tema.nombre.trim())
        .map((tema) => ({
          id: tema.id,
          nombre: tema.nombre.trim(),
          conceptos: (tema.hijos ?? [])
            .filter((concepto) => concepto.tipo === 'concepto')
            .filter((concepto) => concepto.nombre.trim())
            .map((concepto) => ({
              id: concepto.id,
              nombre: concepto.nombre.trim(),
            })),
        }))
        .filter((tema) => tema.conceptos.length > 0),
    }))
    .filter((unidad) => unidad.temas.length > 0);
}

export default function ModalMateria({ materia, onCerrar, onGuardar }: Props) {
  const esEdicion = !!materia;
  const [id] = useState(materia?.id ?? crypto.randomUUID());
  const [nombre, setNombre] = useState(materia?.nombre ?? '');
  const [prefijo, setPrefijo] = useState(
    materia?.prefijo?.replace(/\d$/, '') ?? '',
  );
  const [numero, setNumero] = useState(() =>
    extraerNumeroDesdePrefijo(materia?.prefijo),
  );
  const [prefijoModificado, setPrefijoModificado] = useState(false);
  const [metadataConfirmada, setMetadataConfirmada] = useState(
    !!materia,
  );
  const [editandoMetadatos, setEditandoMetadatos] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoExistenteId] = useState(
    materia?.documentoMateriaId?.trim() || null,
  );
  const [archivoExistenteNombre] = useState(
    materia?.documentoMateriaNombre?.trim() || '',
  );
  const [archivoEliminado, setArchivoEliminado] = useState(false);
  const canvasState = useCurriculoCanvasState(buildTree(materia));
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
    replaceTree,
  } = canvasState;
  const [baselineTree, setBaselineTree] = useState<NodoCurricular>(() =>
    cloneCurriculoTree(buildTree(materia)),
  );
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraccionControllerRef = useRef<AbortController | null>(null);
  const draft = useCurriculoDraftNode();
  const canvasPan = useCurriculoCanvasPan();

  const prefijoFinal = `${prefijo}${numero}`;
  const datosInicialesValidos =
    nombre.trim().length > 0 && prefijo.trim().length > 0;



  useEffect(() => {
    if (!metadataConfirmada || !datosInicialesValidos) return;
    setTree((current) => ({
      ...current,
      nombre: nombre.trim(),
      revisionEstado: current.nombre === nombre.trim()
        ? current.revisionEstado
        : 'modificado',
    }));
  }, [nombre, datosInicialesValidos]);

  useEffect(() => {
    if (!tree.hijos.length) {
      setExpandedIds(new Set([tree.id]));
      return;
    }
    setExpandedIds((current) => {
      if (current.size > 0) return current;
      const next = new Set<string>();
      const collect = (node: NodoCurricular) => {
        next.add(node.id);
        node.hijos.forEach(collect);
      };
      collect(tree);
      return next;
    });
  }, [tree]);


  const generarDesdePlan = async () => {
    if (!datosInicialesValidos) {
      setError('Ingresa el nombre de la materia y el prefijo.');
      return;
    }
    if (!archivo) {
      setError('Selecciona el plan de estudio PDF.');
      return;
    }
    if ((tree.hijos ?? []).length > 0
        && !window.confirm(
          'El nuevo plan reemplazará por completo el árbol actual, incluidos los cambios manuales.',
        )) {
      return;
    }

    setError('');
    setGenerando(true);
    const controller = new AbortController();
    extraccionControllerRef.current = controller;
    try {
      const extracted = await extraerConceptosMateria(archivo, controller.signal);
      const newTree: NodoCurricular = {
        id: id,
        tipo: 'materia',
        nombre: nombre.trim(),
        origen: 'materia',
        revisionEstado: 'original',
        contenido: [],
        hijos: extracted.units.map((unidad) => ({
          id: crypto.randomUUID(),
          tipo: 'unidad',
          nombre: unidad.name,
          origen: 'ia',
          revisionEstado: 'original',
          contenido: [],
          hijos: unidad.topics.map((tema) => ({
            id: crypto.randomUUID(),
            tipo: 'tema',
            nombre: tema.name,
            origen: 'ia',
            revisionEstado: 'original',
            contenido: [],
            hijos: tema.concepts.map((concepto) => ({
              id: crypto.randomUUID(),
              tipo: 'concepto',
              nombre: concepto.name,
              origen: 'ia',
              revisionEstado: 'original',
              estadoConcepto: 'sin_contenido',
              contenido: [],
              hijos: [],
            })),
          })),
        })),
      };
      replaceTree(newTree);
      setDirty(true);
    } catch (caught) {
      if (caught instanceof Error
          && (caught.name === 'AbortError' || caught.name === 'CanceledError')) {
        return;
      }
      setError(materiaExtraccionErrorMessage(caught));
    } finally {
      extraccionControllerRef.current = null;
      setGenerando(false);
    }
  };

  const updateName = (nodeId: string, name: string) => {
    if (!name.trim()) return;
    setTree((current) => renameCurriculoNode(current, nodeId, name.trim()));
    setDirty(true);
    setEditingId(null);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    const movedId = event.dataTransfer.getData('text/plain');
    if (!movedId) return;
    if (draft.draftNode && movedId === draft.draftNode.id) {
      const target = findCurriculoNode(tree, targetId);
      if (!target
          || !isValidCurriculoDraftDrop(draft.draftNode, target)) {
        setError(invalidCurriculoAssociationMessage(draft.draftNode, target ?? tree));
        return;
      }
      setTree((current) =>
        attachCurriculoDraftNode(current, draft.draftNode!, targetId),
      );
      setDirty(true);
      draft.discard();
      return;
    }
    const dragged = findCurriculoNode(tree, movedId);
    const target = findCurriculoNode(tree, targetId);
    if (!dragged || !target || !isValidCurriculoDrop(dragged, target)) {
      if (dragged && target) {
        setError(invalidCurriculoAssociationMessage(dragged, target));
      }
      return;
    }
    setTree((current) => moveCurriculoNode(current, movedId, targetId));
    setDirty(true);
  };

  const guardar = async () => {
    if (!datosInicialesValidos) {
      setError('Ingresa el nombre de la materia y el prefijo.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await onGuardar({
        id,
        nombre: nombre.trim(),
        prefijo: prefijoFinal,
        planEstudioId: '',
        archivo,
        archivoExistenteId,
        archivoEliminado,
        unidades: treeToUnits(tree),
      });
      setBaselineTree(cloneCurriculoTree(tree));
      setDirty(false);
    } catch (caught) {
      setError(materiaDocumentoErrorMessage(
        caught,
        'No se pudo guardar la materia.',
      ));
    } finally {
      setGuardando(false);
    }
  };

  const descartar = () => {
    replaceTree(baselineTree);
    setDirty(false);
    setShowDiscardConfirm(false);
  };

  const cerrar = () => {
    extraccionControllerRef.current?.abort();
    onCerrar();
  };

  const cerrarMetadatos = () => {
    if (editandoMetadatos) {
      setNombre(materia?.nombre ?? nombre);
      setPrefijo(
        materia?.prefijo?.replace(/\d$/, '')
        ?? prefijo,
      );
      setNumero(extraerNumeroDesdePrefijo(
        materia?.prefijo,
      ));
      setMetadataConfirmada(true);
      setEditandoMetadatos(false);
      setEditandoMetadatos(false);
      setError('');
      return;
    }
    cerrar();
  };

  return (
    <article
      className={`mm-overlay${!metadataConfirmada ? ' materia-canvas-setup-open' : ''}`}
    >
      {!metadataConfirmada && (
        <MateriaMetadataModal
          open
          title={esEdicion ? 'Editar materia' : 'Nueva materia'}
          nombre={nombre}
          prefijo={prefijo}
          numero={numero}
          error={error}
          valid={datosInicialesValidos}
          onNombreChange={(value) => {
            setNombre(value);
            if (!prefijoModificado) setPrefijo(derivarPrefijo(value));
          }}
          onPrefijoChange={(value) => {
            setPrefijo(value);
            setPrefijoModificado(true);
          }}
          onNumeroChange={setNumero}
          onClose={cerrarMetadatos}
          onConfirm={() => {
            if (!datosInicialesValidos) return;
            setSelectedId(id);
            setExpandedIds(new Set([id]));
            setError('');
            setMetadataConfirmada(true);
            setEditandoMetadatos(false);
            setTree((current) => ({
              ...current,
              nombre: nombre.trim(),
              revisionEstado: 'modificado',
            }));
            setDirty(true);
          }}
        />
      )}
      <TaskGeneratingOverlay
        visible={generando}
        title="Generando estructura curricular"
        subtitle={archivo?.name}
        onCancel={() => extraccionControllerRef.current?.abort()}
      />
      <article
        className="materia-canvas-modal"
        role="dialog"
        aria-modal={!datosInicialesValidos ? undefined : true}
        inert={!metadataConfirmada ? true : undefined}
      >
        <CurriculoCanvasHeader
          title={prefijoFinal}
          subtitle={nombre.trim()}
          dirty={dirty}
          onEditMetadata={() => {
            setEditandoMetadatos(true);
            setMetadataConfirmada(false);
          }}
          onBack={() => setShowBackConfirm(true)}
          onDiscard={() => setShowDiscardConfirm(true)}
          onSave={() => void guardar()}
        />

        <section className="materia-canvas-layout">
          <MateriaPlanPanel
            archivo={archivo}
            archivoExistenteId={archivoExistenteId}
            archivoExistenteNombre={archivoExistenteNombre}
            archivoEliminado={archivoEliminado}
            generando={generando}
            fileInputRef={fileInputRef}
            onFileChange={(next) => {
              setArchivo(next);
              if (next) setArchivoEliminado(false);
            }}
            onGenerate={() => void generarDesdePlan()}
          />

          <main
            className="curriculo-canvas materia-canvas"
            ref={canvasRef}
            onWheel={(event) => {
              event.preventDefault();
              const factor = event.deltaY < 0 ? 1.1 : 0.9;
              changeZoom(zoom * factor);
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
            <CurriculoNodeTypeSelector
              open={draft.showTypeSelector}
              disabled={
                !metadataConfirmada
                || generando
                || guardando
              }
              onToggle={draft.toggleTypeSelector}
              onSelect={(tipo) => {
                draft.selectType(tipo);
                setDirty(true);
              }}
            />
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
            <div
              className="curriculo-tree-viewport"
              style={{
                width: canvasLayout.width * zoom,
                height: canvasLayout.height * zoom,
              }}
            >
              <section
                className="curriculo-tree"
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
                  editable={true}
                  estadoConcepto={() => 'sin_contenido'}
                  onSelect={setSelectedId}
                  onEdit={setEditingId}
                  onFinishEdit={updateName}
                  onCancelEdit={() => setEditingId(null)}
                  onToggle={(id) => {
                    toggleExpanded(id);
                  }}
                  onDragStart={(event, id) =>
                    event.dataTransfer.setData('text/plain', id)
                  }
                  onDrop={handleDrop}
                  onDelete={setDeleteNodeId}
                  setRef={() => undefined}
                />
              </section>
            </div>

            <CurriculoZoomControls
              zoom={zoom}
              onChange={changeZoom}
            />
            <CurriculoCanvasLegend variant="materia" />
          </main>
        </section>
      </article>

      {showDiscardConfirm && (
        <CurriculoDiscardConfirm
          open
          onConfirm={descartar}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}

      {showBackConfirm && (
        <CurriculoBackConfirm
          open
          onContinue={() => setShowBackConfirm(false)}
          onDiscardAndExit={cerrar}
          onSaveAndExit={() => void guardar().then(cerrar)}
        />
      )}
      {deleteNodeId && (
        <CurriculoDeleteConfirm
          open
          name={findCurriculoNode(tree, deleteNodeId)?.nombre ?? ''}
          descendants={
            (() => {
              const node = findCurriculoNode(tree, deleteNodeId);
              const count = (item: NodoCurricular | null): number =>
                item
                  ? (item.hijos ?? []).reduce(
                      (total, child) => total + 1 + count(child),
                      0,
                    )
                  : 0;
              return count(node);
            })()
          }
          onConfirm={() => {
            setTree((current) =>
              removeCurriculoNode(current, deleteNodeId),
            );
            setSelectedId((current) =>
              current === deleteNodeId ? null : current,
            );
            setEditingId(null);
            setDirty(true);
            setDeleteNodeId(null);
          }}
          onCancel={() => setDeleteNodeId(null)}
        />
      )}
      {error && (
        <article className="materia-canvas-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>×</button>
        </article>
      )}
    </article>
  );
}
