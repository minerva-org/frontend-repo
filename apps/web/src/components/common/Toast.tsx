
import { useEffect,useState } from 'react';

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
  duracion = 5000,
}: Props) {
  const [progreso, setProgreso] = useState(100);

useEffect(() => {
  if (!toast) return;

  if (duracion <= 0) {
    onCerrar();
    return;
  }

  setProgreso(100);

  const inicio = Date.now();
  const intervalo = 20;

  const id = setInterval(() => {
    const transcurrido = Date.now() - inicio;

    const restante = Math.max(
      0,
      100 - (transcurrido / duracion) * 100
    );

    setProgreso(restante);

    if (restante <= 0) {
      clearInterval(id);
      onCerrar();
    }
  }, intervalo);

  return () => clearInterval(id);
}, [toast, duracion, onCerrar]);

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

  if (!toast) return null;
  const config = configuracion[toast.tipo];

  return (
    <article
      className={`toast show position-fixed top-0 end-0 m-3 border-0 shadow`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ zIndex: 1100, minWidth: '400px', maxWidth: '520px' }}
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

      <article className="toast-body bg-body" style={{padding: '20px 20px', fontSize:'20px'}}>
        {toast.mensaje}
      </article>
      <article className="progress rounded-0" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} style={{height:'5px'}}>
        <article className={`progress-bar bg-${config.clase}`} style={{width: `${progreso}%`, transition:'none'}}></article>
      </article>
      
    </article>
  );
}
