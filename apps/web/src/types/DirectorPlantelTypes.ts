export interface DirectorFormState {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  numeroTelefono: string;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  plantelId: number;
  password: string;
}

export interface PlantelItem {
  id: number;
  nombre: string;
  activo?: boolean;
}