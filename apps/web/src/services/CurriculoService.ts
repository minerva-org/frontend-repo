import { apiClient } from './ApiClient';
import type {
  NodoCurricular,
  OrigenNodoCurricular,
  RevisionNodoCurricular,
} from '../types/CurriculoCanvasTypes.ts';

export interface DocumentoFuente {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedBy: string;
  createdAt: string;
}

export interface CurriculoBackend {
  idGrupo: string;
  unidades: Array<{
    id: string;
    nombre: string;
    activo?: boolean;
    temas?: Array<{
      id: string;
      nombre: string;
      activo?: boolean;
      conceptos?: Array<{
        id: string;
        nombre: string;
        activo?: boolean;
        contenidos?: Array<{
          id: string;
          descripcion: string;
        }>;
      }>;
    }>;
  }>;
  fuentes: Array<{
    idDocumento: string;
    idGrupo: string;
    documento: DocumentoFuente;
  }>;
}

export async function getCurriculo(grupoId: string) {
  const response = await apiClient.get<CurriculoBackend>(
    `/api/grupos/${encodeURIComponent(grupoId)}/curriculo`,
  );
  return response.data;
}

export async function putCurriculo(
  grupoId: string,
  tree: NodoCurricular,
) {
  const payload = curriculoNodeToBackendPayload(grupoId, tree);
  const response = await apiClient.put<CurriculoBackend>(
    `/api/grupos/${encodeURIComponent(grupoId)}/curriculo`,
    payload,
  );
  return response.data;
}

export function curriculoNodeToBackendPayload(
  grupoId: string,
  tree: NodoCurricular,
) {
  const toBackendUnidades = (node: NodoCurricular) =>
    (node.hijos ?? []).filter((unidad) => unidad.tipo === 'unidad').map((unidad) => ({
      id: unidad.id.startsWith('TEMP-') ? null : unidad.id,
      nombre: unidad.nombre,
      activo: true,
      temas: (unidad.hijos ?? []).filter((tema) => tema.tipo === 'tema').map((tema) => ({
        id: tema.id.startsWith('TEMP-') ? null : tema.id,
        nombre: tema.nombre,
        activo: true,
        conceptos: (tema.hijos ?? []).filter((concepto) => concepto.tipo === 'concepto').map((concepto) => ({
          id: concepto.id.startsWith('TEMP-') ? null : concepto.id,
          nombre: concepto.nombre,
          activo: true,
          contenidos: (concepto.contenido ?? []).map((contenido) => ({
            id: contenido.id.startsWith('TEMP-') ? null : contenido.id,
            descripcion: contenido.descripcion,
          })),
        })),
      })),
    }));

  return {
    idGrupo: grupoId,
    unidades: toBackendUnidades(tree),
    fuentes: [],
  };
}

export function curriculoBackendToNode(
  backend: CurriculoBackend,
  materiaNombre: string,
): NodoCurricular {
  const root: NodoCurricular = {
    id: `MAT-${backend.idGrupo}`,
    tipo: 'materia',
    nombre: materiaNombre,
    origen: 'materia',
    revisionEstado: 'original',
    contenido: [],
    hijos: (backend.unidades ?? []).filter((unidad) => unidad.activo !== false).map((unidad) => ({
      id: unidad.id,
      tipo: 'unidad',
      nombre: unidad.nombre,
      origen: 'materia',
      revisionEstado: 'original',
      contenido: [],
      hijos: (unidad.temas ?? []).filter((tema) => tema.activo !== false).map((tema) => ({
        id: tema.id,
        tipo: 'tema',
        nombre: tema.nombre,
        origen: 'materia',
        revisionEstado: 'original',
        contenido: [],
        hijos: (tema.conceptos ?? []).filter((concepto) => concepto.activo !== false).map((concepto) => ({
          id: concepto.id,
          tipo: 'concepto',
          nombre: concepto.nombre,
          origen: 'materia',
          revisionEstado: 'original',
          estadoConcepto: (concepto.contenidos?.length ?? 0) > 0
            ? 'con_contenido'
            : 'sin_contenido',
          contenido: (concepto.contenidos ?? []).map((contenido) => ({
            id: contenido.id,
            descripcion: contenido.descripcion,
            origen: 'materia' as OrigenNodoCurricular,
            revisionEstado: 'original' as RevisionNodoCurricular,
          })),
          hijos: [],
        })),
      })),
    })),
  };
  return root;
}

export async function getFuentes(grupoId: string) {
  const response = await apiClient.get<DocumentoFuente[]>(
    `/api/grupos/${encodeURIComponent(grupoId)}/fuentes`,
  );
  return response.data;
}

export async function uploadFuente(grupoId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post<DocumentoFuente>(
    `/api/grupos/${encodeURIComponent(grupoId)}/fuentes`,
    form,
  );
  return response.data;
}

export async function removeFuente(
  grupoId: string,
  documentoId: string,
) {
  await apiClient.delete(
    `/api/grupos/${encodeURIComponent(grupoId)}/fuentes/${encodeURIComponent(documentoId)}`,
  );
}
