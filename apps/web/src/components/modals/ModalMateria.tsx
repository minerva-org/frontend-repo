import {
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Materia } from '../../types/types.ts';
import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';
import {
  extraerConceptosMateria,
  materiaExtraccionErrorMessage,
  materiaDocumentoErrorMessage,
} from '../../services/materiaDocumentoService.ts';
import { cloneCurriculoTree } from '../curriculo/CurriculoCanvasOperations.ts';
import { useCurriculoCanvasState } from '../curriculo/useCurriculoCanvasState.ts';
import MateriaMetadataModal from './MateriaMetadataModal.tsx';
import MateriaPlanPanel from './MateriaPlanPanel.tsx';
import TaskGeneratingOverlay from '../common/TaskGeneratingOverlay.tsx';
import { type ToastData } from '../common/Toast.tsx';
import CurriculoCanvasEditor from '../curriculo/CurriculoCanvasEditor.tsx';
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
  const canvasState = useCurriculoCanvasState(
    buildTree(materia),
    24,
    { slotWidth: 500},
  );
  const {
    tree,
    setTree,
    setSelectedId,
    setExpandedIds,
    replaceTree,
  } = canvasState;
  const [baselineTree, setBaselineTree] = useState<NodoCurricular>(() =>
    cloneCurriculoTree(buildTree(materia)),
  );
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraccionControllerRef = useRef<AbortController | null>(null);

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
      setToast({
        tipo: 'advertencia',
        mensaje: 'Ingresa el nombre de la materia y el prefijo.',
      });
      return;
    }
    if (!archivo) {
      setToast({
        tipo: 'advertencia',
        mensaje: 'Selecciona el plan de estudio PDF o PPTX.',
      });
      return;
    }
    if ((tree.hijos ?? []).length > 0
        && !window.confirm(
          'El nuevo plan reemplazará por completo el árbol actual, incluidos los cambios manuales.',
        )) {
      return;
    }

    setError('');
    setToast(null);
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
      setToast({
        tipo: 'error',
        mensaje: materiaExtraccionErrorMessage(caught),
      });
    } finally {
      extraccionControllerRef.current = null;
      setGenerando(false);
    }
  };

  const guardar = async () => {
    if (!datosInicialesValidos) {
      setToast({
        tipo: 'advertencia',
        mensaje: 'Ingresa el nombre de la materia y el prefijo.',
      });
      return false;
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
      return true;
    } catch (caught) {
      setToast({
        tipo: 'error',
        mensaje: materiaDocumentoErrorMessage(
          caught,
          'No se pudo guardar la materia.',
        ),
      });
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const descartar = () => {
    replaceTree(baselineTree);
    setNombre(materia?.nombre ?? '');
    setPrefijo(materia?.prefijo?.replace(/\d$/, '') ?? '');
    setNumero(extraerNumeroDesdePrefijo(materia?.prefijo));
    setArchivo(null);
    setArchivoEliminado(false);
    setPrefijoModificado(false);
    setDirty(false);
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
            const metadataChanged =
              !esEdicion
              || nombre.trim() !== materia?.nombre?.trim()
              || prefijoFinal !== materia?.prefijo;
            setSelectedId(id);
            setExpandedIds(new Set([id]));
            setError('');
            setMetadataConfirmada(true);
            setEditandoMetadatos(false);
            setTree((current) => ({
              ...current,
              nombre: nombre.trim(),
              revisionEstado: metadataChanged
                ? 'modificado'
                : current.revisionEstado,
            }));
            if (metadataChanged) setDirty(true);
          }}
        />
      )}
      <CurriculoCanvasEditor
        canvas={canvasState}
        title={prefijoFinal}
        subtitle={nombre.trim()}
        dirty={dirty}
        editable
        addDisabled={generando || guardando || !metadataConfirmada}
        variant="materia"
        onEditMetadata={() => {
          setEditandoMetadatos(true);
          setMetadataConfirmada(false);
        }}
        leftPanel={
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
              setDirty(true);
            }}
            onGenerate={() => void generarDesdePlan()}
          />
        }
        estadoConcepto={() => 'sin_contenido'}
        toast={toast}
        onToastChange={setToast}
        onDirty={() => setDirty(true)}
        onClose={cerrar}
        onSave={guardar}
        onDiscard={descartar}
      >
        <TaskGeneratingOverlay
          visible={generando}
          title="Generando estructura curricular"
          subtitle={archivo?.name}
          onCancel={() => extraccionControllerRef.current?.abort()}
        />
      </CurriculoCanvasEditor>
    </article>
  );
}
