import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../../services/ApiClient';

interface Solicitud {
  id: string;
  grupoId: string;
  grupoNombre: string;
  alumnoId: string;
  alumnoNombre: string;
}

interface SolicitudesPendientesProps {
  grupoId: string;
  onAceptada?: () => void;
}

export default function SolicitudesPendientes({
  grupoId,
  onAceptada,
}: SolicitudesPendientesProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const contenedor = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const { data } = await apiClient.get<Solicitud[]>('/api/solicitud/solicitudes');
      setSolicitudes((data ?? []).filter((s) => s.grupoId === grupoId));
    } catch {
      setError('No fue posible cargar las solicitudes.');
    } finally {
      setCargando(false);
    }
  }, [grupoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!abierto) return;

    const cerrarAlClickFuera = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', cerrarAlClickFuera);
    return () => document.removeEventListener('mousedown', cerrarAlClickFuera);
  }, [abierto]);

  function alternar() {
    if (!abierto) void cargar();
    setAbierto((prev) => !prev);
  }

  async function decidir(id: string, accion: 'aceptar' | 'rechazar') {
    try {
      setProcesando(id);
      setError('');

      if (accion === 'aceptar') {
        await apiClient.post(`/api/solicitud/${id}/aceptar`);
      } else {
        await apiClient.delete(`/api/solicitud/${id}/rechazar`);
      }

      setSolicitudes((prev) => prev.filter((s) => s.id !== id));
      if (accion === 'aceptar') onAceptada?.();
    } catch {
      setError(
        accion === 'aceptar'
          ? 'No fue posible aceptar la solicitud.'
          : 'No fue posible rechazar la solicitud.'
      );
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div ref={contenedor} className="position-relative d-inline-block">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary position-relative"
        onClick={alternar}
        aria-label="Solicitudes de ingreso"
        aria-expanded={abierto}
        title="Solicitudes de ingreso"
      >
        <i className="bi bi-person-plus" />
        {solicitudes.length > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
            style={{ backgroundColor: 'var(--seige-alerta)' }}
          >
            {solicitudes.length}
          </span>
        )}
      </button>

      {abierto && (
        <section
          className="position-absolute end-0 mt-2 border rounded-3 shadow p-2"
          style={{
            width: '320px',
            maxWidth: '85vw',
            zIndex: 1050,
            backgroundColor: 'var(--seige-superficie)',
            borderColor: 'var(--seige-borde)',
          }}
        >
          <p
            className="small fw-semibold mb-2 px-1"
            style={{ color: 'var(--ar-profundo)' }}
          >
            Solicitudes de ingreso
          </p>

          {error && (
            <p
              className="small rounded-3 p-2 mb-2"
              style={{
                backgroundColor: 'var(--seige-error-fondo)',
                color: 'var(--seige-error-texto)',
              }}
            >
              {error}
            </p>
          )}

          {cargando ? (
            <p className="small px-1 mb-0" style={{ color: 'var(--seige-texto-secundario)' }}>
              Cargando...
            </p>
          ) : solicitudes.length === 0 ? (
            <p className="small px-1 mb-0" style={{ color: 'var(--seige-texto-secundario)' }}>
              No hay solicitudes pendientes.
            </p>
          ) : (
            <ul className="list-unstyled mb-0" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {solicitudes.map((s) => (
                <li
                  key={s.id}
                  className="d-flex align-items-center justify-content-between gap-2 p-1"
                >
                  <span className="small text-truncate" style={{ color: 'var(--ar-profundo)' }}>
                    {s.alumnoNombre}
                  </span>

                  <span className="d-flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => void decidir(s.id, 'rechazar')}
                      disabled={procesando === s.id}
                      aria-label={`Rechazar a ${s.alumnoNombre}`}
                      title="Rechazar"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm text-white"
                      style={{ backgroundColor: 'var(--seige-exito)' }}
                      onClick={() => void decidir(s.id, 'aceptar')}
                      disabled={procesando === s.id}
                      aria-label={`Aceptar a ${s.alumnoNombre}`}
                      title="Aceptar"
                    >
                      <i className="bi bi-check-lg" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}