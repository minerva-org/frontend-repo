import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;
  const blocked = attempts >= MAX_ATTEMPTS;
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (blocked){
        return;
    }

    const passwordError = validatePassword(password);
    if(passwordError){
        setError(passwordError);
        return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      console.log('Login exitoso:', data);
      setAttempts(0);
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if(newAttempts >= MAX_ATTEMPTS){
        setError('Has alcanzado el máximo de intentos. Intenta más tarde.');
      } else {
        setError('Credenciales no validas');
      }
    } finally {
      setLoading(false);
    }
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
    <form onSubmit={handleSubmit}>
      <h1>Iniciar sesión</h1>

      <label>
        Usuario
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={blocked}
        />
      </label>

      <label>
        Contraseña
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={blocked}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={blocked}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
      </label>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit" disabled={loading || blocked}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
