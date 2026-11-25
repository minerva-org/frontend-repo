import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { apiClient } from '../services/ApiClient';

export const GRUPO_PENDIENTE_KEY = 'grupoPendiente';

type Estado = 'enviando' | 'exito' | 'error';

function mensajeDeError(err: unknown): string {
  if(axios.isAxiosError(err)){
    const status = err.response?.status;
    if (status === 409) return 'Ya enviaste la solicitud para este grupo o ya perteneces al mismo. Espera la respuesta del docente' 
    if (status ===404) return 'No se encontró el grupo.'
    if (status === 403) return 'No tienes permiso para solicitar unirte al grupo.' 
  }
  return 'No fue posible enviar la solicitud. Inténtalo de nuevo.'
}

export default function Unirse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [estado, setEstado] = useState<Estado>('enviando');
  const [mensaje, setMensaje] = useState('');
  const enviado = useRef(false);

  const grupoId = searchParams.get('grupoId');

  useEffect(() => {
    if (!grupoId) {
      setEstado('error');
      setMensaje('El código QR no contiene un grupo válido.');
      return;
    }

    if (!isAuthenticated) {
      sessionStorage.setItem(GRUPO_PENDIENTE_KEY, grupoId);
      navigate('/login', { replace: true });
      return;
    }

    if (role !== 'alumno') {
      setEstado('error');
      setMensaje('Solo los alumnos pueden solicitar unirse a un grupo.');
      return;
    }

    if (enviado.current) return;
    enviado.current = true;

    apiClient
      .post('/api/solicitud', { grupoId })
      .then(() => {
        sessionStorage.removeItem(GRUPO_PENDIENTE_KEY);
        setEstado('exito');
        setMensaje('Solicitud enviada. Espera a que el docente la apruebe.');
      })
      .catch((err) => {
        sessionStorage.removeItem(GRUPO_PENDIENTE_KEY);
        setEstado('error');
        setMensaje(mensajeDeError(err));
      });
  }, [grupoId, isAuthenticated, role, navigate]);

  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center">
      <section
        className="card border rounded-3 shadow-sm text-center p-4"
        style={{ maxWidth: '460px', width: '100%' }}
      >
        {estado === 'enviando' && (
          <>
            <article className="spinner-border mx-auto mb-3" role="status" />
            <p className="mb-0">Enviando solicitud...</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <i className="bi bi-check-circle-fill fs-1 mb-2" style={{ color: 'var(--seige-exito)' }} />
            <h1 className="h5 fw-bold">Solicitud enviada</h1>
            <p>{mensaje}</p>
          </>
        )}

        {estado === 'error' && (
          <>
            <i className="bi bi-exclamation-circle fs-1 mb-2" style={{ color: 'var(--seige-alerta)' }} />
            <h1 className="h5 fw-bold">No se pudo completar</h1>
            <p>{mensaje}</p>
          </>
        )}

        {estado !== 'enviando' && (
          <button
            type="button"
            className="btn text-white"
            style={{ backgroundColor: 'var(--ar-profundo)' }}
            onClick={() => navigate('/alumno')}
          >
            Ir a mi panel
          </button>
        )}
      </section>
    </main>
  );
}