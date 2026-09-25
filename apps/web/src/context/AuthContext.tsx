import {createContext, useState, type ReactNode, useContext} from 'react';
import { login as loginService, type LoginResponse} from '../services/authService.ts';

export type UserRole = 'alumno' | 'docente' | 'coordinador' | 'directorPlanta' | 'directorGeneral';

interface AuthContextType {
    token: string | null;
    role: UserRole | null;
    email:string | null;
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

    const [email, setEmail] = useState<string | null>(
        sessionStorage.getItem('email') || null
    )

async function login (emailInput: string, password: string) {
    const data: LoginResponse = await loginService(emailInput, password);
    setToken(data.token);
    setRole(data.role);
    setEmail(emailInput);
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('email',emailInput)
    return data;
}

function logout() {
    setToken(null);
    setRole(null);
    setEmail(null)
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('email');
}   

return (
    <AuthContext.Provider
     value={{ token, role, email,isAuthenticated: !!token, login, logout }}
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