
import { apiClient } from './ApiClient';

export interface PasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function validarPassword(currentPassword: string): Promise<void> {
  await apiClient.post('/auth/validar-password', {
    currentPassword,
  });
}

export async function cambiarPassword(
  request: PasswordRequest
): Promise<void> {
  await apiClient.put('/auth/cambiar-password', request);
}
