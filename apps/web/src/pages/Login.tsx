import { useState, type SubmitEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';
import logo from '../assets/logo.webp'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null); 
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailError = validateEmail(email);
    if(emailError){
        setModalMessage('Compruebe su correo y/o contraseña y vuelva a intentarlo');
        return;
    }
    const passwordError = validatePassword(password);
    if(passwordError){
        setModalMessage('Compruebe su correo y/o contraseña y vuelva a intentarlo');
        return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.role === 'alumno' ? '/alumno' : '/grupos');
    } catch (err) {
        setModalMessage('Compruebe su correo y/o contraseña y vuelva a intentarlo');
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
        if(!emailRegex.test(email)){
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

    const btnAceptar =  useRef<HTMLButtonElement>(null);

    
    useEffect(()=>{
      if (modalMessage){
        btnAceptar.current?.focus();
      }
    }, [modalMessage]);

  return (
    <article className="login-screen">
      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <img className="login-logo" src={logo} alt="Logo Seige" />
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">
            Accede con tu correo institucional para continuar.
          </p>

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

          <label className="login-field">
            <span className="login-field-label">Contraseña</span>
            <article className="login-password-row">
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder='contraseña'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
              </button>
            </article>
          </label>

          <button className="login-submit" type="submit" disabled={loading} style={{visibility: loading ? 'hidden' : 'visible'}}>
            Ingresar
          </button>
        </form>
      </main>

      {modalMessage && (
        <article className="login-modal-error ">
          <article className="login-modal">
            <h2 className="login-modal-title">Correo y/o contraseña incorrecto</h2>
            <p className="login-modal-message">{modalMessage}</p>
            <button  ref={btnAceptar} className="login-modal-button" onClick={closeModal}>
              Aceptar
            </button>
          </article>
        </article>
      )}

    </article>
  );
}
