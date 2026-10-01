import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import '../styles/Login.css';
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
            ? '/plantel/dashboard'
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
      const destination = data.role === 'alumno'
        ? '/alumno'
        : data.role === 'directorGeneral'
          ? '/planteles'
          : data.role === 'directorPlantel'
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
    <article className="login-screen">
      <aside className="login-brand">
        <article className="login-brand-header">
          <span className="login-logo-wrap">
            <img className="login-logo" src={logo} alt="Logo Seige" />
          </span>
          <article>
            <p className="login-brand-name">Preparatoria Chapala Gutiérrez</p>
            <p className="login-brand-platform">Plataforma SeigeTEC</p>
          </article>
        </article>

        <article className="login-brand-hero">
          <p className="login-brand-headline">Diagnóstico y evaluación al ritmo de tu aula.</p>
          <p className="login-brand-text">
            Plataforma para planeación didáctica, quizzes y seguimiento académico de tu institución.
          </p>
        </article>

        <p className="login-brand-footnote">
          Las cuentas son creadas por tu institución. No hay registro abierto.
        </p>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">Usa tu usuario institucional.</p>

          <label className="login-field">
            <span className="login-field-label">Usuario</span>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario "
              autoComplete="username"
              required
            />
          </label>

          <article className="login-field">
            <label className="login-field-label" htmlFor="password">Contraseña</label>
            <article className="login-password-row">
              <input
                id="password"
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-toggle"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true"></i>
              </button>
            </article>
          </article>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>

          
        </form>
      </main>

      {modalMessage && (
        <article className="login-modal-error">
          <article className="login-modal">
            <h2 className="login-modal-title">No se pudo iniciar sesión</h2>
            <p className="login-modal-message">{modalMessage}</p>
            <button ref={btnAceptar} className="login-modal-button" onClick={closeModal}>
              Aceptar
            </button>
          </article>
        </article>
      )}
    </article>
  );
}
