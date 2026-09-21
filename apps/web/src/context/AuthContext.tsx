import {createContext, useState, type ReactNode, useContext} from 'react';
import { login as loginService, type LoginResponse} from '../services/authService.ts';

export type UserRole = 'alumno' | 'docente' | 'coordinador' | 'directorPlanta' | 'directorGeneral';

interface AuthContextType {
    token: string | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<LoginResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token,setToken] = useState <string | null>(
        sessionStorage.getItem('token') || null
    );

    const [role, setRole] = useState<UserRole | null>(
        (sessionStorage.getItem('role') as UserRole) || null
    );

async function login (email: string, password: string) {
    const data: LoginResponse = await loginService(email, password);
    setToken(data.token);
    setRole(data.role);
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('role', data.role);
    return data;
}

function logout() {
    setToken(null);
    setRole(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
}   

return (
    <AuthContext.Provider
     value={{ token, role, isAuthenticated: !!token, login, logout }}
     >
        {children}
    </AuthContext.Provider>
);
}

export function useAuth(){
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}