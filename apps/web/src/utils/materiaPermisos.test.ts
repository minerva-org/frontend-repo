import { describe, expect, it } from 'vitest';
import type { Materia } from '../types/types.ts';
import { acortarNombreArchivo, nombreVisibleMateria, puedeCambiarEstadoMateria } from './materiaPermisos.ts';

function materia(overrides: Partial<Materia> = {}): Materia {
  return {
    id: 'MAT-1',
    nombre: 'Matemáticas',
    prefijo: 'MAT1',
    planEstudioId: '',
    ...overrides,
  };
}

describe('materiaPermisos', () => {
  // Input: materia tronco común (plantelId=null) y Director de Plantel.
  // Resultado esperado: no puede activar ni desactivar la materia.
  it('bloquea el cambio de estado de tronco común para director de plantel', () => {
    expect(puedeCambiarEstadoMateria('directorPlantel', materia({ plantelId: null }))).toBe(false);
  });

  // Input: materia específica (plantelId=1) y Director de Plantel.
  // Resultado esperado: puede activar o desactivar la materia.
  it('permite el cambio de estado de materia específica', () => {
    expect(puedeCambiarEstadoMateria('directorPlantel', materia({ plantelId: 1 }))).toBe(true);
  });

  // Input: materia tronco común y Coordinador.
  // Resultado esperado: no puede activar ni desactivar la materia.
  it('bloquea el cambio de estado de tronco común para coordinador', () => {
    expect(puedeCambiarEstadoMateria('coordinador', materia({ plantelId: null }))).toBe(false);
  });

  // Input: Director General, independientemente de plantelId.
  // Resultado esperado: puede administrar el estado.
  it('permite cambio de estado al Director General', () => {
    expect(puedeCambiarEstadoMateria('directorGeneral', materia({ plantelId: null }))).toBe(true);
  });

  // Input: rol sin acceso (docente) y materia cualquiera.
  // Resultado esperado: no se prueba por permisos de catálogo; el helper conserva autorización superior.
  it('mantiene el comportamiento seguro para rol no superior', () => {
    expect(puedeCambiarEstadoMateria('docente', materia({ plantelId: 1 }))).toBe(true);
  });

  // Input: nombre de documento vacío o solo espacios.
  // Resultado esperado: mostrar texto de archivo ausente.
  it('usa un nombre visible seguro cuando el documento está en blanco', () => {
    expect(nombreVisibleMateria(materia({ documentoMateriaNombre: '   ' }))).toBe('Sin archivo asociado');
  });

  // Input: nombre de documento válido.
  // Resultado esperado: mostrar exactamente el nombre, sin texto adicional.
  it('muestra el nombre real del documento', () => {
    expect(nombreVisibleMateria(materia({ documentoMateriaNombre: 'plan-estudio.pdf' }))).toBe('plan-estudio.pdf');
  });

  // Input: nombre null.
  // Resultado esperado: mostrar texto de archivo ausente.
  it('maneja nombre de documento null', () => {
    expect(nombreVisibleMateria(materia({ documentoMateriaNombre: null }))).toBe('Sin archivo asociado');
  });

  // Input: nombre largo con extensión PDF.
  // Resultado esperado: recortar el nombre conservando la extensión.
  it('recorta nombres largos sin perder la extensión', () => {
    const nombre = 'Plan-anual-de-estudios-y-programacion-didactica-completa.pdf';
    const acortado = acortarNombreArchivo(nombre, 40);
    expect(acortado.length).toBeLessThanOrEqual(40);
    expect(acortado).toContain('...');
    expect(acortado).toMatch(/\.pdf$/);
  });

  // Input: nombre dentro del límite.
  // Resultado esperado: devolverlo sin modificar.
  it('conserva nombres que ya caben', () => {
    expect(acortarNombreArchivo('plan.pdf', 40)).toBe('plan.pdf');
  });
});
