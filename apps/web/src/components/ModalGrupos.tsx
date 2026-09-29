import { useState, type SubmitEvent } from 'react';
import AutocompleteInput from './AutoCompleteInput.tsx';
import '../styles/ModalGrupos.css';

// TODO: reemplazar por el catálogo real de materias activas (endpoint /materias)
const MOCK_MATERIAS = ['Matemáticas III', 'Física II', 'Ética'];

const MOCK_docenteS = [
  'Prof. García',
  'Prof. Ruiz',
  'Prof. Mendoza',
  'Prof. Torres',
  'Prof. Salinas',
];

const MOCK_numeroEstudiantes = [
  'Ana López',
  'Carlos Pérez',
  'Diana Flores',
  'Eduardo Ramírez',
  'Fernanda Cruz',
  'Gabriel Ortiz',
  'Helena Vega',
  'Iván Morales',
];

export interface NewGroupData {
  grupo: string;
  grado: string;
  docente: string | null;
  numeroEstudiantes: string[];
}

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (data: NewGroupData) => void;
}

export default function CreateGroupModal({ onClose, onCreate }: CreateGroupModalProps) {
  const [materia, setMateria] = useState<string[]>([]);
  const [grado, setgrado] = useState('');
  const [docente, setdocente] = useState<string[]>([]);
  const [numeroEstudiantes, setnumeroEstudiantes] = useState<string[]>([]);
  const [error, setError] = useState('');

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (materia.length === 0 || !grado.trim()) {
      setError('Selecciona la materia y captura el grado/grupo.');
      return;
    }
    setError('');

    onCreate({
      grupo: materia[0],
      grado: grado.trim(),
      docente: docente[0] ?? null,
      numeroEstudiantes,
    });
    onClose();
  }

  return (
    <article className="create-group-overlay">
      <article className="create-group-modal">
        <article className="create-group-header">
          <h2 className="create-group-title">Nuevo grupo</h2>
        </article>

        <form onSubmit={handleSubmit} className="create-group-form" noValidate>
          <AutocompleteInput
            label="Materia"
            placeholder="Buscar materia..."
            options={MOCK_MATERIAS}
            selected={materia}
            onChange={setMateria}
          />

          <label className="create-group-field">
            <span className="create-group-label">Grado / Grupo</span>
            <input
              className="create-group-input"
              type="text"
              placeholder="Ej. 3.° Bachillerato — Grupo A"
              value={grado}
              onChange={(e) => setgrado(e.target.value)}
              required
            />
          </label>

          <AutocompleteInput
            label="Docente"
            placeholder="Buscar docente..."
            options={MOCK_docenteS}
            selected={docente}
            onChange={setdocente}
          />

          <AutocompleteInput
            label="Alumnos"
            placeholder="Buscar y agregar alumnos..."
            options={MOCK_numeroEstudiantes}
            multiple
            selected={numeroEstudiantes}
            onChange={setnumeroEstudiantes}
          />

          {error && <p className="create-group-error">{error}</p>}

          <article className="create-group-actions">
            <button type="button" className="create-group-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="create-group-submit">
              Crear grupo
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}