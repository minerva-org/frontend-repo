import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import logo from '../assets/logo.webp';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const btnAceptar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      const destination = role === 'alumno'
        ? '/alumno'
        : role === 'directorGeneral'
          ? '/planteles'
          : role === 'directorPlantel'
            ? '/plantel/directorio-docente'
            : '/grupos';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, role]);

  useEffect(() => {
    if (modalMessage) {
      btnAceptar.current?.focus();
    }
  }, [modalMessage]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password.trim()) {
      setModalMessage('Debe ingresar usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(trimmedUsername, password);
      const loginRole = data.role ?? role;

      const destination = loginRole === 'alumno'
        ? '/alumno'
        : loginRole === 'directorGeneral'
          ? '/planteles'
          : loginRole === 'directorPlantel'
            ? '/plantel/dashboard'
            : '/grupos';

      navigate(destination, { replace: true });
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setModalMessage(null);
  }

   return (
    <article className="container-fluid min-vh-100 p-0">
      <article className="row g-0 min-vh-100">

        <aside className="col-12 col-lg-6 d-flex flex-column justify-content-between gap-5 bg-primary text-light p-4 p-md-5">

          <article className="d-flex align-items-center gap-3">
            <img
              src={logo}
              alt="Logo Seige"
              width={48}
              height={48}
              className="object-fit-contain rounded-3 bg-light p-1 flex-shrink-0"
            />

            <article>
              <p className="fw-bold mb-0">
                Preparatoria Chapala Gutiérrez
              </p>
              <p className="text-white-50 mb-0">
                Plataforma SeigeTEC
              </p>
            </article>
          </article>

          <article>
            <p className="display-6 fw-bold mb-3">
              Diagnóstico y evaluación al ritmo de tu aula.
            </p>

            <p className="text-white-50 fs-5 mb-0">
              Plataforma para planeación didáctica, quizzes y seguimiento académico de tu institución.
            </p>
          </article>

          <p className="small text-white-50 mb-0">
            Las cuentas son creadas por tu institución. No hay registro abierto.
          </p>
        </aside>

        <main className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-light p-4 p-md-5">

          <form
            className="w-100 bg-white border rounded-4 shadow p-4 p-md-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <h1 className="h2 fw-bold mb-2">
              Iniciar sesión
            </h1>

            <p className="text-secondary mb-4">
              Usa tu usuario institucional.
            </p>

            <article className="mb-3">
              <label htmlFor="username" className="form-label fw-semibold">
                Usuario
              </label>

              <input
                id="username"
                className="form-control form-control-lg"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                autoComplete="username"
                required
              />
            </article>

            <article className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">
                Contraseña
              </label>

              <article className="input-group input-group-lg">
                <input
                  id="password"
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="btn bg-secondary border-0"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-white`} 
                    aria-hidden="true"
                  />
                </button>
              </article>
            </article>

            <button
              className="btn bg-secondary text-white btn-lg w-100"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>
        </main>
      </article>

      {modalMessage && (
        <>
          <article
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
          >
            <article className="modal-dialog modal-dialog-centered">
              <article className="modal-content shadow">
                <article className="modal-header">
                  <h2 className="modal-title fs-5" id="login-error-title">
                    No se pudo iniciar sesión
                  </h2>
                </article>

                <article className="modal-body">
                  <p className="mb-0">{modalMessage}</p>
                </article>

                <article className="modal-footer">
                  <button
                    ref={btnAceptar}
                    type="button"
                    className="btn btn-primary"
                    onClick={closeModal}
                  >
                    Aceptar
                  </button>
                </article>
              </article>
            </article>
          </article>

          <article className="modal-backdrop show" />
        </>
      )}
    </article>
  );
}

