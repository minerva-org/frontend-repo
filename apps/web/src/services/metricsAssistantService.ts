import { apiClient } from './ApiClient';

export type MetricsAssistantScope =
  | 'QUIZ'
  | 'GRUPO'
  | 'PLANTEL'
  | 'INSTITUCION';

export interface MetricsAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MetricsAssistantResponse {
  answer: string;
  model: string;
}

export async function askMetricsAssistant(
  scope: MetricsAssistantScope,
  entityId: string | undefined,
  prompt: string,
  messages: MetricsAssistantMessage[],
): Promise<MetricsAssistantResponse> {
  const { data } = await apiClient.post<MetricsAssistantResponse>(
    '/api/metrics-assistant/chat',
    { scope, entityId, prompt, messages },
    { timeout: 260_000 },
  );
  return data;
}
