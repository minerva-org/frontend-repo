import { isAxiosError } from 'axios';
import { apiClient } from './ApiClient';

export interface ExtractionPrompts {
  role: string;
  instructions: string;
  outputContract: string;
}

export interface ExtractionTree {
  units: Array<{
    name: string;
    topics: Array<{
      name: string;
      concepts: Array<{ name: string }>;
    }>;
  }>;
}

export type SourceType = 'STUDY_PLAN' | 'SOURCE_MATERIAL';

export interface PromptDefaults {
  prompts: ExtractionPrompts;
  model: string;
  maxPdfBytes: number;
}

export interface DocumentLabResponse {
  model: string;
  durationMs: number;
  rawOutput: string;
  tree: ExtractionTree | null;
  validationErrors: string[];
}

const endpoint = '/api/ai/laboratory/documents';

export async function getExtractionPrompts(signal: AbortSignal): Promise<PromptDefaults> {
  const { data } = await apiClient.get<PromptDefaults>(`${endpoint}/prompts`, { signal });
  return data;
}

export async function runExtraction(
  file: File,
  sourceType: SourceType,
  prompts: ExtractionPrompts,
): Promise<DocumentLabResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('request', new Blob([JSON.stringify({ sourceType, prompts })], {
    type: 'application/json',
  }));
  try {
    const { data } = await apiClient.post<DocumentLabResponse>(`${endpoint}/extract`, form, {
      headers: { 'Content-Type': undefined },
      timeout: 260_000,
    });
    return data;
  } catch (error) {
    if (isAxiosError<DocumentLabResponse>(error) && error.response?.status === 422) {
      const data = error.response.data;
      if (typeof data.rawOutput === 'string' && Array.isArray(data.validationErrors)
          && data.validationErrors.every((entry) => typeof entry === 'string')) {
        return data;
      }
    }
    throw error;
  }
}

export function laboratoryErrorMessage(error: unknown): string {
  if (isAxiosError<{ mensaje?: string; message?: string; detail?: string } | string>(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim() === 'Invalid CORS request') {
      return 'El backend rechazo el origen de la peticion (CORS). Revisa los origenes permitidos.';
    }
    const message = data && typeof data === 'object'
      ? data.mensaje || data.message || data.detail
      : undefined;
    if (typeof message === 'string' && message) return message;
    if (error.response?.status === 413) return 'El archivo supera el limite de carga permitido.';
    if (error.response?.status === 403) {
      return 'El backend rechazo la solicitud (HTTP 403). Revisa la sesion, los permisos y el backend de destino.';
    }
    if (error.code === 'ECONNABORTED') return 'Se agoto el tiempo de espera de la prueba.';
    if (!error.response) return 'No se pudo contactar al backend.';
    return `La prueba fallo (HTTP ${error.response.status}).`;
  }
  return 'No se pudo completar la operacion del laboratorio.';
}
