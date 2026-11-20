import { isAxiosError } from 'axios';
import { apiClient } from './ApiClient';

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
      return 'El archivo no tiene un formato PDF válido.';
    }
    if (error.response?.status === 403) {
      return 'No tienes permiso para subir el plan de estudio de esta materia.';
    }
    if (error.response?.status === 401) {
      return 'Tu sesión venció. Inicia sesión nuevamente.';
    }
    if (error.response?.status === 400) {
      return 'El servidor no pudo procesar el archivo PDF seleccionado.';
    }
    if (error.response?.status === 503) {
      return 'El servicio de almacenamiento no está disponible. Intenta nuevamente.';
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
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Solo se permiten archivos PDF.');
  }
  if (file.size <= 0) {
    throw new Error('El archivo PDF está vacío.');
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
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Solo se permiten archivos PDF.');
  }
  if (file.size <= 0) {
    throw new Error('El archivo PDF está vacío.');
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
