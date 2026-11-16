export interface PlantelItem {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Institucion {
  id: number;
  nombre: string;
}

export interface PlantelForm {
  nombre: string;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  institucionId: number | null;
}

