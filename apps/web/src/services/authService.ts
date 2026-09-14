export interface LoginResponse {
  token: string;
  role: 'alumno' | 'docente' | 'coordinador';
}

const MOCK_USERS = [
    { username: 'alumno', password: 'Alumno#2024x', role: 'alumno' as const },
    { username: 'docente', password: 'Docente#2024x', role: 'docente' as const },
    { username: 'coordinador', password: 'Coordinador#2024x', role: 'coordinador' as const }
];

export async function login(username:string, password:string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const found = MOCK_USERS.find(
        (user) => user.username === username && user.password === password
    );
    
    if (!found){
        throw new Error('Usuario y/o contraseña incorrecta');
    }

    const fakeToken =`mock-jwt-${found.username}-${Date.now()}`;

    return { token: fakeToken, role: found.role };
    
}