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
