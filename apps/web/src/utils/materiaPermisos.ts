import type { Materia, UserRole } from '../types/types.ts';

export function puedeCambiarEstadoMateria(
  role: UserRole | null,
  materia: Materia,
): boolean {
  if (role !== 'directorPlantel' && role !== 'coordinador') {
    return true;
  }
  return materia.plantelId != null;
}

export function nombreVisibleMateria(materia: Materia): string {
  return materia.documentoMateriaNombre?.trim() || 'Sin archivo asociado';
}

export function acortarNombreArchivo(nombre: string, limite = 40): string {
  const limpio = nombre.trim();
  if (limpio.length <= limite) return limpio;

  const ultimoPunto = limpio.lastIndexOf('.');
  const extension = ultimoPunto > 0 && ultimoPunto > limpio.length - 10
    ? limpio.slice(ultimoPunto)
    : '';
  const longitudBase = Math.max(1, limite - extension.length - 3);
  return `${limpio.slice(0, longitudBase)}...${extension}`;
}
