import '../../styles/TaskGeneratingOverlay.css';

interface TaskGeneratingOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string | null;
  onCancel?: () => void;
}

/**
 * Overlay de bloqueo compartido para tareas de IA en curso
 * (generación de currículo, quizzes, etc.).
 */
export default function TaskGeneratingOverlay({
  visible,
  title,
  subtitle,
  onCancel,
}: TaskGeneratingOverlayProps) {
  if (!visible) return null;
  return (
    <section className="task-generating" role="status" aria-live="polite">
      <article>
        <span className="spinner-border" role="status" />
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onCancel}
          >
            <i className="bi bi-x-lg me-1" />
            Cancelar
          </button>
        )}
      </article>
    </section>
  );
}
