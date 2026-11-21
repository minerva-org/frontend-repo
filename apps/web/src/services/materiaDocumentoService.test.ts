import { describe, expect, it } from 'vitest';
import {
  materiaDocumentoErrorMessage,
  materiaExtraccionErrorMessage,
  validarExtraccionMateria,
  construirUrlDescargaDocumento,
} from './materiaDocumentoService.ts';

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

  // Input: respuesta HTTP 502 sin detalles internos.
  // Resultado esperado: mensaje simple de reintento sin mencionar infraestructura.
  it('describe 502 sin exponer tecnología', () => {
    const error = { response: { status: 502, data: {} }, code: 'ERR_BAD_RESPONSE', isAxiosError: true };
    expect(materiaDocumentoErrorMessage(error)).toBe('No se pudo guardar el archivo. Intenta nuevamente.');
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

  // Input: árbol válido con unidad, tema y concepto.
  // Resultado esperado: no se reporta error de estructura.
  it('valida un árbol académico completo', () => {
    expect(validarExtraccionMateria({
      units: [{
        name: 'Unidad',
        topics: [{
          name: 'Tema',
          concepts: [{ name: 'Concepto' }],
        }],
      }],
    })).toBeNull();
  });

  // Input: units vacío.
  // Resultado esperado: informar que no existe jerarquía utilizable.
  it('rechaza un árbol sin unidades', () => {
    expect(validarExtraccionMateria({ units: [] }))
      .toContain('jerarquía');
  });

  // Input: unidad sin temas.
  // Resultado esperado: informar el nodo incompleto.
  it('rechaza una unidad sin temas', () => {
    expect(validarExtraccionMateria({
      units: [{ name: 'Unidad', topics: [] }],
    })).toContain('temas');
  });

  // Input: tema sin conceptos.
  // Resultado esperado: informar el nodo incompleto.
  it('rechaza un tema sin conceptos', () => {
    expect(validarExtraccionMateria({
      units: [{
        name: 'Unidad',
        topics: [{ name: 'Tema', concepts: [] }],
      }],
    })).toContain('conceptos');
  });

  // Input: respuesta NO_USABLE_HIERARCHY.
  // Resultado esperado: mensaje específico al usuario.
  it('describe archivo sin contenido académico', () => {
    const error = {
      response: {
        status: 422,
        data: { code: 'NO_USABLE_HIERARCHY', message: 'Sin contenido utilizable.' },
      },
      isAxiosError: true,
    };
    expect(materiaExtraccionErrorMessage(error))
      .toBe('El archivo no contiene contenido académico utilizable.');
  });

  // Input: respuesta OLLAMA_UNAVAILABLE.
  // Resultado esperado: mensaje específico de servicio no disponible.
  it('describe Ollama no disponible', () => {
    const error = {
      response: {
        status: 503,
        data: { code: 'OLLAMA_UNAVAILABLE', message: 'No disponible.' },
      },
      isAxiosError: true,
    };
    expect(materiaExtraccionErrorMessage(error))
      .toBe('El servicio de generación no está disponible.');
  });

  // Input: documentoMateriaId válido.
  // Resultado esperado: construir URL codificada del endpoint de descarga.
  it('construye la URL de descarga del documento', () => {
    expect(construirUrlDescargaDocumento('DOC 123'))
      .toBe('/api/files/DOC%20123');
  });
});
