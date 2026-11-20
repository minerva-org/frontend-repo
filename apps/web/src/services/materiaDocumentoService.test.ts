import { describe, expect, it } from 'vitest';
import { materiaDocumentoErrorMessage } from './materiaDocumentoService.ts';

describe('materiaDocumentoErrorMessage', () => {
  // Input: error 413 sin mensaje backend.
  // Resultado esperado: explicar el límite de 10 MiB.
  it('describe el límite de tamaño', () => {
    const error = { response: { status: 413, data: {} }, code: 'ERR_BAD_REQUEST', isAxiosError: true };
    expect(materiaDocumentoErrorMessage(error)).toContain('10 MiB');
  });

  // Input: error 403 sin mensaje backend.
  // Resultado esperado: explicar falta de permiso.
  it('describe la falta de permiso', () => {
    const error = { response: { status: 403, data: {} }, code: 'ERR_BAD_REQUEST', isAxiosError: true };
    expect(materiaDocumentoErrorMessage(error)).toContain('permiso');
  });

  // Input: mensaje backend estructurado.
  // Resultado esperado: conservar el mensaje rastreable.
  it('prefiere el mensaje estructurado del backend', () => {
    const error = { response: { status: 400, data: { mensaje: 'Documento no encontrado con el id: 123' } }, isAxiosError: true };
    expect(materiaDocumentoErrorMessage(error)).toBe('Documento no encontrado con el id: 123');
  });

  // Input: error sin respuesta de red.
  // Resultado esperado: indicar fallo de contacto.
  it('describe ausencia de respuesta', () => {
    const error = { code: 'ERR_NETWORK', isAxiosError: true };
    expect(materiaDocumentoErrorMessage(error)).toContain('contactar');
  });

  // Input: Error estándar con mensaje.
  // Resultado esperado: reutilizar el mensaje como causa útil.
  it('usa el mensaje de Error estándar', () => {
    expect(materiaDocumentoErrorMessage(new Error('El archivo está vacío'))).toBe('El archivo está vacío');
  });

  // Input: valor desconocido sin información.
  // Resultado esperado: usar fallback descriptivo.
  it('usa fallback para error desconocido', () => {
    expect(materiaDocumentoErrorMessage(undefined, 'Fallo de prueba')).toBe('Fallo de prueba');
  });
});
