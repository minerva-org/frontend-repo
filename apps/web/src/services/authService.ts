import { apiClient } from "./ApiClient";

export interface LoginResponse {
  token: string;
  role: 'alumno' | 'docente' | 'coordinador' | 'directorPlanta' | 'directorGeneral';
}
/*
export async function login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { 
        username:email, 
        password
     });
    return data;
}*/

/* NO LO BORREN PUEDE SER NECESARIO PARA PRUEBAS */


const MOCK_USERS = [
 { email: 'alumno@chapala.edu.mx', password: 'Alumno#2024x', role: 'alumno' as const },
  { email: 'docente@chapala.edu.mx', password: 'Docente#2024x', role: 'docente' as const },
  { email: 'coordinador@chapala.edu.mx', password: 'Coordinador#2024x', role: 'coordinador' as const },
    { email: 'directorplanta@chapala.edu.mx', password: 'DirectorPlanta#2024x', role: 'directorPlanta' as const },
    { email: 'directorgeneral@chapala.edu.mx', password: 'DirectorGeneral#2024x', role: 'directorGeneral' as const }
];

export async function login(email:string, password:string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const found = MOCK_USERS.find(
        (user) => user.email === email && user.password === password
    );
    
    if (!found){
        throw new Error('Usuario y/o contraseña incorrecta');
    }

    const fakeToken =`mock-jwt-${found.email}-${Date.now()}`;

    return { token: fakeToken, role: found.role };
    
}/**/