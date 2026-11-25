import { isAxiosError } from 'axios';
import { apiClient } from './ApiClient';

const isSupportedStudyFile = (name: string) =>
  /\.(pdf|pptx)$/i.test(name);

export interface DocumentoMateriaDTO {
  id: string;
  objectKey: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedBy: string;
  createdAt: string | null;
}

export interface DocumentoMateriaUploadDTO {
  documento: DocumentoMateriaDTO;
  reutilizado: boolean;
}

export interface FileUploadDTO {
  fileId: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface ExtraccionMateriaTree {
  units: Array<{
    name: string;
    topics: Array<{
      name: string;
      concepts: Array<{ name: string }>;
    }>;
  }>;
}

export interface ExtraccionMateriaError {
  code?: string;
  message?: string;
  mensaje?: string;
  validationErrors?: string[];
}

export function materiaExtraccionErrorMessage(error: unknown): string {
  if (isAxiosError<ExtraccionMateriaError>(error)) {
    const data = error.response?.data;
    const code = data?.code;

    if (code === 'NO_USABLE_HIERARCHY') {
      return 'El archivo no contiene contenido académico utilizable.';
    }
    if (code === 'INCOMPLETE_HIERARCHY') {
      return 'La estructura extraída está incompleta. Revisa unidades, temas y conceptos.';
    }
    if (code === 'NO_EXTRACTABLE_TEXT') {
      return 'No se pudo extraer texto del documento. Verifica que contenga texto seleccionable.';
    }
    if (code === 'PDF_INVALID') {
      return 'El archivo no es un PDF o PPTX válido.';
    }
    if (code === 'EXTRACTED_TEXT_TOO_LARGE') {
      return 'El contenido extraído supera el límite permitido.';
    }
    if (code === 'INVALID_MODEL_OUTPUT') {
      return 'El agente no pudo generar una estructura válida.';
    }
    if (code === 'OLLAMA_UNAVAILABLE') {
      return 'El servicio de generación no está disponible.';
    }
    if (code === 'OLLAMA_TIMEOUT') {
      return 'La generación excedió el tiempo de espera.';
    }

    const message = data?.message || data?.mensaje;
    if (typeof message === 'string' && message.trim()) return message.trim();

    if (error.response?.status === 413) {
      return 'El archivo supera el límite permitido de 10 MiB.';
    }
    if (error.response?.status === 415) {
      return 'El archivo no tiene un formato PDF o PPTX válido.';
    }
    if (error.response?.status === 422) {
      return 'No fue posible extraer una estructura válida del archivo.';
    }
    if (error.response?.status === 503) {
      return 'El servicio de generación no está disponible.';
    }
    if (error.response?.status === 504) {
      return 'La generación excedió el tiempo de espera.';
    }
    if (error.response?.status === 502) {
      return 'El agente no pudo procesar el archivo.';
    }
    if (!error.response) {
      return 'No se pudo contactar al servidor de generación.';
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'No se pudo generar el desglose de la materia.';
}

export async function extraerConceptosMateria(
  file: File,
  signal?: AbortSignal,
): Promise<ExtraccionMateriaTree> {
  if (!isSupportedStudyFile(file.name)) {
    throw new Error('Solo se permiten archivos PDF o presentaciones PPTX.');
  }
  if (file.size <= 0) {
    throw new Error('El archivo está vacío.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('El archivo supera el límite de 10 MiB.');
  }

  const form = new FormData();
  form.append('file', file);

  try {
    const { data } = await apiClient.post<ExtraccionMateriaTree>(
      '/api/materias/extract',
      form,
      { timeout: 260_000, signal },
    );
    const validationError = validarExtraccionMateria(data);
    if (validationError) throw new Error(validationError);
    return data;
  } catch (error) {
    if (isAxiosError(error)
        && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError')) {
      throw error;
    }
    if (error instanceof Error && !isAxiosError(error)) throw error;
    throw new Error(materiaExtraccionErrorMessage(error));
  }
}

export function validarExtraccionMateria(
  tree: ExtraccionMateriaTree | null | undefined,
): string | null {
  if (!tree || !Array.isArray(tree.units) || tree.units.length === 0) {
    return 'No se encontró una jerarquía académica utilizable.';
  }

  for (const unidad of tree.units) {
    if (!unidad.name?.trim()) return 'Existe una unidad sin nombre.';
    if (!Array.isArray(unidad.topics) || unidad.topics.length === 0) {
      return `La unidad "${unidad.name}" no contiene temas.`;
    }

    for (const tema of unidad.topics) {
      if (!tema.name?.trim()) return 'Existe un tema sin nombre.';
      if (!Array.isArray(tema.concepts) || tema.concepts.length === 0) {
        return `El tema "${tema.name}" no contiene conceptos.`;
      }

      for (const concepto of tema.concepts) {
        if (!concepto.name?.trim()) return 'Existe un concepto sin nombre.';
      }
    }
  }
  return null;
}

export function materiaDocumentoErrorMessage(
  error: unknown,
  fallback = 'No se pudo subir el plan de estudio.',
): string {
  if (isAxiosError<{ mensaje?: string; message?: string; detail?: string } | string>(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data.trim();

    const message = data && typeof data === 'object'
      ? data.mensaje || data.message || data.detail
      : undefined;
    if (typeof message === 'string' && message.trim()) return message.trim();

    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo contactar al servidor para subir el archivo.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Se agotó el tiempo de espera mientras se subía el plan de estudio.';
    }
    if (error.response?.status === 413) {
      return 'El archivo supera el límite permitido de 10 MiB.';
    }
    if (error.response?.status === 415) {
      return 'El archivo debe ser un PDF o una presentación PPTX válida.';
    }
    if (error.response?.status === 403) {
      return 'No tienes permiso para subir el plan de estudio de esta materia.';
    }
    if (error.response?.status === 401) {
      return 'Tu sesión venció. Inicia sesión nuevamente.';
    }
    if (error.response?.status === 400) {
      return 'El servidor no pudo procesar el documento seleccionado.';
    }
    if (error.response?.status === 503) {
      return 'No se pudo guardar el archivo. Intenta nuevamente.';
    }
    if (error.response?.status === 502 || error.response?.status === 500) {
      return 'No se pudo guardar el archivo. Intenta nuevamente.';
    }
    if (error.response?.status) {
      return `El servidor rechazó la subida del archivo (HTTP ${error.response.status}).`;
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

export async function uploadArchivoTemporal(
  file: File,
): Promise<FileUploadDTO> {
  if (!isSupportedStudyFile(file.name)) {
    throw new Error('Solo se permiten archivos PDF o presentaciones PPTX.');
  }
  if (file.size <= 0) {
    throw new Error('El archivo está vacío.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('El archivo supera el límite de 10 MiB.');
  }

  const form = new FormData();
  form.append('file', file);

  try {
    const { data } = await apiClient.post<FileUploadDTO>(
      '/api/files',
      form,
    );
    return data;
  } catch (error) {
    throw new Error(materiaDocumentoErrorMessage(error));
  }
}

export async function uploadPlanMateria(
  materiaId: string,
  file: File,
): Promise<DocumentoMateriaUploadDTO> {
  if (!isSupportedStudyFile(file.name)) {
    throw new Error('Solo se permiten archivos PDF o presentaciones PPTX.');
  }
  if (file.size <= 0) {
    throw new Error('El archivo está vacío.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('El archivo supera el límite de 10 MiB.');
  }

  const form = new FormData();
  form.append('file', file);

  try {
    const { data } = await apiClient.post<DocumentoMateriaUploadDTO>(
      `/api/materias/${encodeURIComponent(materiaId)}/documento`,
      form,
    );
    return data;
  } catch (error) {
    throw new Error(materiaDocumentoErrorMessage(error));
  }
}

export async function getPlanMateria(
  materiaId: string,
): Promise<DocumentoMateriaDTO | null> {
  try {
    const { data } = await apiClient.get<DocumentoMateriaDTO>(
      `/api/materias/${encodeURIComponent(materiaId)}/documento`,
    );
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function removePlanMateria(materiaId: string): Promise<void> {
  await apiClient.delete(
    `/api/materias/${encodeURIComponent(materiaId)}/documento`,
  );
}

export async function deleteArchivoTemporal(fileId: string): Promise<void> {
  await apiClient.delete(`/api/files/${encodeURIComponent(fileId)}`);
}

export function construirUrlDescargaDocumento(documentoMateriaId: string): string {
  return `/api/files/${encodeURIComponent(documentoMateriaId)}`;
}

export async function descargarDocumentoMateria(
  documentoMateriaId: string,
  fallbackFilename: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const { data, headers } = await apiClient.get<Blob>(
    construirUrlDescargaDocumento(documentoMateriaId),
    {
      responseType: 'blob',
      onDownloadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    },
  );
  const disposition = headers['content-disposition'] as string | undefined;
  const encodedName = disposition?.match(/filename\\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition?.match(/filename=\"?([^\";]+)\"?/i)?.[1];
  const filename = encodedName
    ? decodeURIComponent(encodedName)
    : plainName || fallbackFilename;
  const url = URL.createObjectURL(data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
