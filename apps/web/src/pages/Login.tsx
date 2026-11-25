import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import logo from '../assets/logo.webp';
import { GRUPO_PENDIENTE_KEY } from './UnirseAGrupo.tsx'

function initialDestination(role: string | null | undefined) {
  switch (role) {
    case 'alumno':
      return '/alumno';
    case 'directorGeneral':
    case 'directorPlantel':
    case 'coordinador':
    case 'docente':
      return role === 'directorPlantel'
        ? '/plantel/dashboard'
        : '/metricas-tronco-comun';
    default:
      return '/grupos';
  }
}

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
      const pendiente = sessionStorage.getItem(GRUPO_PENDIENTE_KEY);
      if (pendiente) {
        navigate(`/unirse?grupoId=${encodeURIComponent(pendiente)}`, { replace: true });
        return;
      }
      navigate(initialDestination(role), { replace: true });
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

      const pendiente = sessionStorage.getItem(GRUPO_PENDIENTE_KEY);
      if(pendiente){
        navigate(`/unirse?grupoId=${encodeURIComponent(pendiente)}`, {
          replace: true,
        });
        return;
      }
      navigate(initialDestination(loginRole), { replace: true });
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
      <article className="row g-0 min-vh-100 position-relative">
        <aside className="col-6 bg-primary">
        </aside>
        <section className="col-6 bg-light">
        </section>

        <section className="position-absolute top-50 start-50 translate-middle w-100 d-flex justify-content-center px-3">
          <form
            className="login-form bg-white border rounded-4 shadow p-3 p-md-4"
            style={{ width: '100%', maxWidth: '520px' }}
            onSubmit={handleSubmit}
            noValidate
          >
            <article>
              <article className="d-flex flex-column align-items-center gap-3 mb-4">
                <img
                  src={logo}
                  alt="Logo Seige"
                  width={220}
                  height={220}
                  className="login-logo object-fit-contain rounded-3 bg-light p-1"
                />

                <article>
                  <h1 className=" display-6 mb-0 fw-bold pt-2">
                    SeigeTEC
                  </h1>
                </article>
              </article>
            </article>

              <p className="h2 fw-bold mb-2 text-center pt-3">
                Inicio de sesión
              </p>

              <p className=" fw-bold mb-4 text-center">
                Bienvenido, usa tus credenciales para ingresar a la plataforma.
              </p>

              <article className="mb-3">
                <label htmlFor="username" className="form-label fw-semibold">
                  Correo
                </label>

                <input
                  id="username"
                  className="form-control form-control-lg"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu correo"
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
              {loading ? 'Ingresando...' : 'Inciar sesión'}
            </button>

            <NavLink to="/"  className="d-block text-center mt-3">¿Olvidaste tu contraseña?</NavLink>
          </form>
        </section>

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
              <article className="modal-content shadow rounded-4">
                <article className="modal-header bg-primary text-light">
                  <h2 className="modal-title fs-5 fw-bold text-center" id="login-error-title">
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

