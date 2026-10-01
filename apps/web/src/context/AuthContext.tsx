import { createContext, useState, type ReactNode, useContext } from 'react';
import { login as loginService, type LoginResponse } from '../services/authService.ts';
import type { UserRole } from '../types.ts';

interface SelectedPlantel {
  id: number;
  nombre: string;
}

interface AuthContextType {
  token: string | null;
  role: UserRole | null;
  effectiveRole: UserRole | null;
  username: string | null;
  email: string | null;
  selectedPlantel: SelectedPlantel | null;
  setSelectedPlantel: (next: SelectedPlantel | null) => void;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token') || null);
  const [role, setRole] = useState<UserRole | null>(() => {
    const storedRole = sessionStorage.getItem('role') as UserRole | null;
    if (storedRole) return storedRole;
    const currentToken = sessionStorage.getItem('token');
    return currentToken ? (sessionStorage.getItem('username') === 'bootstrap' ? 'admin' : null) : null;
  });
  const [username, setUsername] = useState<string | null>(() => sessionStorage.getItem('username') || null);
  const [email, setEmail] = useState<string | null>(() => sessionStorage.getItem('email') || null);
  const [selectedPlantel, setSelectedPlantelState] = useState<SelectedPlantel | null>(() => {
    const raw = sessionStorage.getItem('selectedPlantel');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as SelectedPlantel;
      if (typeof parsed?.id === 'number' && typeof parsed?.nombre === 'string') return parsed;
      return null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const effectiveRole: UserRole | null = role;

  function setSelectedPlantel(next: SelectedPlantel | null) {
    if (!next) {
      setSelectedPlantelState(null);
      sessionStorage.removeItem('selectedPlantel');
      return;
    }

    setSelectedPlantelState(next);
    sessionStorage.setItem('selectedPlantel', JSON.stringify(next));
  }

  async function login(usernameInput: string, password: string) {
    const data = await loginService(usernameInput, password);

    const nextRole = data.role ?? (usernameInput.toLowerCase() === 'bootstrap' ? 'admin' : null);

    setToken(data.token);
    setRole(nextRole);
    setUsername(usernameInput);
    setEmail(usernameInput);

    sessionStorage.setItem('token', data.token);
    if (nextRole) {
      sessionStorage.setItem('role', nextRole);
    } else {
      sessionStorage.removeItem('role');
    }
    sessionStorage.setItem('username', usernameInput);
    sessionStorage.setItem('email', usernameInput);

    setSelectedPlantelState(null);
    sessionStorage.removeItem('selectedPlantel');

    const loggedUser = response.data.usuario ?? response.data.user ?? response.data;

    setUser(loggedUser);
    localStorage.setItem('user', JSON.stringify(loggedUser));

    return data;
  }

  function logout() {
    setToken(null);
    setRole(null);
    setUsername(null);
    setEmail(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('selectedPlantel');
    setSelectedPlantelState(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        effectiveRole,
        username,
        email,
        selectedPlantel,
        setSelectedPlantel,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

interface AuthUser {
  id: string;
  email: string;
  rol: string;
}