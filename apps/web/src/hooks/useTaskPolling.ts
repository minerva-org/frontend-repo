import { useEffect, useRef, useState } from 'react';

export interface TaskPollingStatus {
  estado: string;
}

interface UseTaskPollingOptions<TStatus extends TaskPollingStatus> {
  enabled: boolean;
  fetchStatus: (taskId: string) => Promise<TStatus>;
  cancelStatus?: (taskId: string) => Promise<void>;
  intervalMs?: number;
  isTerminal?: (status: TStatus) => boolean;
}

export function useTaskPolling<TStatus extends TaskPollingStatus>({
  enabled,
  fetchStatus,
  cancelStatus,
  intervalMs = 1500,
  isTerminal = (status) =>
    status.estado === 'COMPLETADA' || status.estado === 'ERROR',
}: UseTaskPollingOptions<TStatus>) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const fetchStatusRef = useRef(fetchStatus);
  const cancelStatusRef = useRef(cancelStatus);
  const isTerminalRef = useRef(isTerminal);

  fetchStatusRef.current = fetchStatus;
  cancelStatusRef.current = cancelStatus;
  isTerminalRef.current = isTerminal;

  useEffect(() => {
    if (!enabled || !taskId) return;

    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const poll = async () => {
      try {
        const next = await fetchStatusRef.current(taskId);
        if (cancelled) return;
        setStatus(next);
        setError(null);
        if (isTerminalRef.current(next)) {
          clearTimer();
          return;
        }
      } catch (caught) {
        if (cancelled) return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'No se pudo consultar la tarea.',
        );
        clearTimer();
        return;
      }
      timerRef.current = window.setTimeout(poll, intervalMs);
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [enabled, intervalMs, taskId]);

  const start = (id: string) => {
    setStatus(null);
    setError(null);
    setTaskId(id);
  };

  const cancel = async () => {
    if (!taskId) return;
    if (cancelStatusRef.current) {
      await cancelStatusRef.current(taskId);
    }
    setStatus(null);
    setError(null);
    setTaskId(null);
  };

  const reset = () => {
    setStatus(null);
    setError(null);
    setTaskId(null);
  };

  return {
    taskId,
    status,
    error,
    start,
    cancel,
    reset,
  };
}
