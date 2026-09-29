import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import AutocompleteInput from './AutoCompleteInput.tsx';
import { apiClient } from '../services/ApiClient';
import { fetchPersonasByRol, type PersonaRecord } from '../services/personaService';
import { useAuth } from '../context/AuthContext.tsx';
import '../styles/ModalGrupos.css';

// TODO: reemplazar por el catálogo real de materias activas (endpoint /materias)
const MOCK_MATERIAS = ['Matemáticas III', 'Física II', 'Ética'];

interface GrupoSelectablePersona {
  id: string;
  label: string;
}

export interface NewGroupData {
  grupo: string;
  grado: string;
  docente: string | null;
  docenteId: string | null;
  materia: string;
  alumnosIds: string[];
  numeroEstudiantes: string[];
  plantelId: number | null;
}

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (data: NewGroupData) => void;
}

export default function CreateGroupModal({ onClose, onCreate }: CreateGroupModalProps) {
  const { selectedPlantel } = useAuth();
  const [materia, setMateria] = useState<string[]>([]);
  const [grado, setgrado] = useState('');
  const [docente, setdocente] = useState<string[]>([]);
  const [numeroEstudiantes, setnumeroEstudiantes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [docentesBD, setDocentesBD] = useState<GrupoSelectablePersona[]>([]);
  const [alumnosBD, setAlumnosBD] = useState<GrupoSelectablePersona[]>([]);
  const [materiasBD, setMateriasBD] = useState<string[]>(MOCK_MATERIAS);

  useEffect(() => {
    async function loadPeople() {
      try {
        const [docentesResponse, alumnosResponse] = await Promise.all([
          fetchPersonasByRol('DOCENTE'),
          fetchPersonasByRol('ALUMNO'),
        ]);

        setDocentesBD(
          (docentesResponse.data ?? []).map((persona: PersonaRecord) => ({
            id: persona.id,
            label: `${persona.nombre} ${persona.apellido}`.trim(),
          })),
        );
        setAlumnosBD(
          (alumnosResponse.data ?? []).map((persona: PersonaRecord) => ({
            id: persona.id,
            label: `${persona.nombre} ${persona.apellido}`.trim(),
          })),
        );
      } catch {
        setDocentesBD([]);
        setAlumnosBD([]);
      }
    }

    void loadPeople();
  }, []);

  useEffect(() => {
    async function loadMaterias() {
      try {
        const response = await apiClient.get<Array<{ nombre: string }>>('/api/materias');
        const materias = (response.data ?? []).map((materiaItem) => materiaItem.nombre).filter(Boolean);
        if (materias.length > 0) {
          setMateriasBD(materias);
        }
      } catch {
        setMateriasBD(MOCK_MATERIAS);
      }
    }

    void loadMaterias();
  }, []);

  const docenteOptions = useMemo(() => docentesBD.map((item) => item.label), [docentesBD]);
  const alumnoOptions = useMemo(() => alumnosBD.map((item) => item.label), [alumnosBD]);

  function validarSeleccion(label: string, options: string[]) {
    return options.some((opt) => opt.toLowerCase() === label.toLowerCase());
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (materia.length === 0 || !grado.trim()) {
      setError('Selecciona la materia y captura el grado/grupo.');
      return;
    }

    if (!docente[0]) {
      setError('Selecciona un docente para el grupo.');
      return;
    }

    if (!validarSeleccion(docente[0], docenteOptions)) {
      setError('Selecciona un docente existente desde el listado.');
      return;
    }

    if (numeroEstudiantes.some((alumno) => !validarSeleccion(alumno, alumnoOptions))) {
      setError('Selecciona alumnos existentes desde el listado.');
      return;
    }

    const docenteId = docentesBD.find((item) => item.label === docente[0])?.id ?? null;
    const alumnosIds = numeroEstudiantes
      .map((label) => alumnosBD.find((item) => item.label === label)?.id ?? null)
      .filter((value): value is string => Boolean(value));

    setError('');

    onCreate({
      grupo: materia[0],
      grado: grado.trim(),
      docente: docente[0] ?? null,
      docenteId,
      materia: materia[0],
      alumnosIds,
      numeroEstudiantes,
      plantelId: selectedPlantel?.id ?? null,
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
            options={materiasBD}
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
            options={docenteOptions}
            selected={docente}
            onChange={setdocente}
          />

          <AutocompleteInput
            label="Alumnos"
            placeholder="Buscar y agregar alumnos..."
            options={alumnoOptions}
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