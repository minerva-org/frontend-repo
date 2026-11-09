
import { useEffect } from 'react';

export interface ToastData {
  mensaje: string;
  tipo: 'exito' | 'error' | 'advertencia';
}

interface Props {
  toast: ToastData | null;
  onCerrar: () => void;
  duracion?: number;
}

export default function Toast({
  toast,
  onCerrar,
  duracion = 3500,
}: Props) {
  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(onCerrar, duracion);

    return () => clearTimeout(timeout);
  }, [toast, duracion, onCerrar]);

  if (!toast) return null;

  const configuracion = {
    exito: {
      clase: 'success',
      icono: 'bi-check-circle-fill',
      titulo: 'Éxito',
    },
    error: {
      clase: 'danger',
      icono: 'bi-exclamation-circle-fill',
      titulo: 'Error',
    },
    advertencia: {
      clase: 'warning',
      icono: 'bi-exclamation-triangle-fill',
      titulo: 'Advertencia',
    },
  };

  const config = configuracion[toast.tipo];

  return (
    <article
      className={`toast show position-fixed top-0 end-0 m-3 border-0 shadow`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ zIndex: 1100, minWidth: '300px', maxWidth: '420px' }}
    >
      <article className={`toast-header bg-${config.clase} text-white`}>
        <i className={`bi ${config.icono} me-2`} />
        <strong className="me-auto">{config.titulo}</strong>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onCerrar}
          aria-label="Cerrar"
        />
      </article>

      <article className="toast-body bg-body">
        {toast.mensaje}
      </article>
    </article>
  );
}
