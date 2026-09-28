import { apiClient } from "./ApiClient";
import { isAxiosError } from "axios";

export interface LoginResponse {
  token: string;
  role: 'alumno' | 'docente' | 'coordinador' | 'directorPlanta' | 'directorGeneral';
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    try{
        const { data } = await apiClient.post<LoginResponse>('/auth/login', { 
        username:email, 
        password
     });
    return data;
    } catch (err){
        if(isAxiosError(err) && [401,403].includes(err.response?.status ?? 0)){
            throw new Error('Verifique sus credenciales', {cause: err});
        }
        throw new Error('No se puedo conectar con el servidor. Intenta mas tarde', {cause: err});
    }
     
}

