import type { PersonaRecord } from '../services/personaService';
import type { PlantelItem } from './PlantelTypes';
import type { SubmitEvent } from 'react';

export interface DocenteFormState {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  calle: string;
  colonia: string;
  codigoPostal: string;
  municipio: string;
  estado: string;
  numeroTelefono: string;
  email: string;
  plantelId: number | null;
  rol: 'DOCENTE' | 'COORDINADOR';
  password: string;
  carrera: string;
  tituloEdu: string;
}

export interface DocenteModalProps {
  planteles: PlantelItem[];
  docente: PersonaRecord | null;
  loading: boolean;
  form: DocenteFormState;
  formError: string | null;
  onClose: () => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onChange: (next: DocenteFormState) => void;
  canChoosePlantel: boolean;
  hidePlantelField: boolean;
  hideRoleField: boolean;
  defaultPlantelName: string;
}