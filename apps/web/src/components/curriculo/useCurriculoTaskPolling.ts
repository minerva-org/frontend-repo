import {
  cancelCurriculumTask,
  getCurriculumTask,
  type CurriculumTaskStatus,
} from '../../services/CurriculoIaService';
import { useTaskPolling } from '../../hooks/useTaskPolling';

export function useCurriculoTaskPolling(
  grupoId: string,
  enabled: boolean,
) {
  const polling = useTaskPolling<CurriculumTaskStatus>({
    enabled,
    fetchStatus: (taskId) => getCurriculumTask(grupoId, taskId),
    cancelStatus: (taskId) => cancelCurriculumTask(grupoId, taskId),
  });

  return {
    tareaId: polling.taskId,
    status: polling.status,
    error: polling.error,
    start: polling.start,
    cancel: polling.cancel,
    reset: polling.reset,
  };
}
