import { useState, type SubmitEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { USE_MOCK, MOCK_USERS } from '../services/authService.ts';
import '../styles/Login.css';
import logo from '../assets/logo.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const btnAceptar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modalMessage) {
      btnAceptar.current?.focus();
    }
  }, [modalMessage]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const correo = email.trim();

    if (validateEmail(correo) || validatePassword(password)) {
      setModalMessage('Compruebe su correo y/o contraseña y vuelva a intentarlo');
      return;
    }

    setLoading(true);
    try {
      const data = await login(correo, password);
      navigate(data.role === 'alumno' ? '/alumno' : '/grupos');
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

  function validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@chapala\.edu\.mx$/;
    if (!emailRegex.test(email)) {
      return 'Ingrese un correo institucional válido';
    }
    return null;
  }

  function validatePassword(password: string): string | null {
    if (password.length < 10 || password.length > 18) {
      return 'La contraseña debe tener entre 10 y 18 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Debe incluir al menos una mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'Debe incluir al menos una minúscula';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Debe incluir al menos un carácter especial';
    }
    return null;
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
          <p className="login-brand-headline">
            Diagnóstico y evaluación al ritmo de tu aula.
          </p>
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
          <p className="login-subtitle">Usa el correo institucional que te asignaron.</p>

          <label className="login-field">
            <span className="login-field-label">Correo institucional</span>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@chapala.edu.mx"
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

          <article className="login-options">
            <label className="login-check">
              <input type="checkbox" />
              <span>Mantener sesión iniciada</span>
            </label>
            <button type="button" className="login-link">
              ¿Olvidaste tu contraseña?
            </button>
          </article>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
            style={{ visibility: loading ? 'hidden' : 'visible' }}
          >
            Entrar
          </button>

          <p className="login-note">
            ¿Sin cuenta? Solicítala a tu coordinador de sede o al director de tu plantel.
          </p>

          
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
