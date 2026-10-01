import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import AutocompleteInput from './AutoCompleteInput.tsx';
import { apiClient } from '../services/ApiClient';
import {
  fetchPersonas,
  fetchPersonasByRol,
  type PersonaRecord,
} from '../services/personaService';
import { useAuth } from '../context/AuthContext.tsx';
import '../styles/ModalGrupos.css';

interface GrupoSelectablePersona {
  id: string;
  label: string;
}

export interface NewGroupData {
  grupo: string;
  claveGrupo: string;
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
  onCreate: (data: NewGroupData) => Promise<void> | void;
}

const normalize = (value: unknown) =>
  String(value ?? '').trim().toLowerCase();

export default function CreateGroupModal({
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const { role, email, selectedPlantel } = useAuth();
  const rolActual = normalize(role);

  const esDocente = rolActual === 'docente';
  const esCoordinador = rolActual === 'coordinador';
  const puedeDarClase = esDocente || esCoordinador;

  const [materia, setMateria] = useState<string[]>([]);
  const [claveGrupo, setClaveGrupo] = useState('');
  const [semestre, setSemestre] = useState('');
  const [docente, setDocente] = useState<string[]>([]);
  const [numeroEstudiantes, setNumeroEstudiantes] = useState<string[]>([]);
  const [materiasBD, setMateriasBD] = useState<string[]>([]);
  const [docentesBD, setDocentesBD] = useState<GrupoSelectablePersona[]>([]);
  const [alumnosBD, setAlumnosBD] = useState<GrupoSelectablePersona[]>([]);
  const [propiaPersona, setPropiaPersona] =
    useState<GrupoSelectablePersona | null>(null);
  const [creatorPlantelId, setCreatorPlantelId] = useState<number | null>(null);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCreator() {
      if (!email) {
        setPropiaPersona(null);
        return;
      }

      try {
        const response = await fetchPersonas();
        const creator = (response.data ?? []).find(
          (persona) =>
            normalize(persona.email) === normalize(email),
        );

        setPropiaPersona(
          creator
            ? {
                id: String(creator.id),
                label: `${creator.nombre ?? ''} ${creator.apellido ?? ''}`.trim(),
              }
            : null,
        );

        setCreatorPlantelId(creator?.plantelId ?? null);
      } catch {
        setPropiaPersona(null);
        setCreatorPlantelId(null);
      }
    }

    void loadCreator();
  }, [email]);

  useEffect(() => {
    async function loadPeople() {
      setPeopleLoading(true);
      setPeopleError(null);

      try {
        const response = await fetchPersonas();
        const personas = response.data ?? [];

        setDocentesBD(
          personas
            .filter((persona) => {
              const rol = normalize(persona.rol ?? persona.role);
              return rol === 'docente' || rol === 'coordinador';
            })
            .map((persona) => ({
              id: String(persona.id),
              label: `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim(),
            })),
        );

        setAlumnosBD(
          personas
            .filter((persona) => {
              const rol = normalize(persona.rol ?? persona.role);
              return rol === 'alumno';
            })
            .map((persona) => ({
              id: String(persona.id),
              label: `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim(),
            })),
        );
      } catch (err) {
        console.error('Error cargando personas:', err);
        setPeopleError('No se pudo cargar la lista de personas.');
      } finally {
        setPeopleLoading(false);
      }
    }

    void loadPeople();
  }, []);

  useEffect(() => {
    async function loadMaterias() {
      try {
        const response = await apiClient.get<Array<{ nombre: string }>>(
          '/api/materias',
        );

        setMateriasBD(
          (response.data ?? [])
            .map((item) => item.nombre)
            .filter(Boolean),
        );
      } catch {
        setMateriasBD([]);
        setError('No se pudieron cargar las materias.');
      }
    }

    void loadMaterias();
  }, []);

  const docenteOptions = useMemo(
    () => docentesBD.map((item) => item.label),
    [docentesBD],
  );

  const alumnoOptions = useMemo(
    () => alumnosBD.map((item) => item.label),
    [alumnosBD],
  );

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!materia[0] || !claveGrupo.trim() || !semestre.trim()) {
      setError('Captura materia, clave del grupo y semestre.');
      return;
    }

    let docenteId: string | null = null;
    let docenteLabel: string | null = null;

    if (esDocente) {
      if (!propiaPersona?.id) {
        setError('No se pudo identificar al docente.');
        return;
      }

      docenteId = propiaPersona.id;
      docenteLabel = propiaPersona.label;
    } else {
      const seleccionado = docentesBD.find(
        (item) => normalize(item.label) === normalize(docente[0]),
      );

      if (!seleccionado) {
        setError('Selecciona un docente válido.');
        return;
      }

      docenteId = seleccionado.id;
      docenteLabel = seleccionado.label;
    }

    const alumnosIds = numeroEstudiantes
      .map(
        (label) =>
          alumnosBD.find(
            (item) => normalize(item.label) === normalize(label),
          )?.id ?? null,
      )
      .filter((id): id is string => id !== null);

    const payload: NewGroupData = {
      grupo: materia[0],
      claveGrupo: claveGrupo.trim(),
      grado: semestre.trim(),
      docente: docenteLabel,
      docenteId,
      materia: materia[0],
      alumnosIds,
      numeroEstudiantes,
      plantelId: selectedPlantel?.id ?? creatorPlantelId ?? null,
    };

    console.log('Payload final:', payload);

    void Promise.resolve(onCreate(payload))
      .then(onClose)
      .catch((err) => {
        console.error('Error creando grupo:', err);
        setError('No se pudo crear el grupo.');
      });
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
            <span className="create-group-label">Clave del grupo</span>
            <input
              className="create-group-input"
              value={claveGrupo}
              onChange={(event) => setClaveGrupo(event.target.value)}
              placeholder="Ej. MAT-1A"
            />
          </label>

          <label className="create-group-field">
            <span className="create-group-label">Semestre</span>
            <input
              className="create-group-input"
              value={semestre}
              onChange={(event) => setSemestre(event.target.value)}
              placeholder="Ej. 1er semestre"
            />
          </label>

          {(!puedeDarClase || esCoordinador) && (
            <AutocompleteInput
              label="Docente"
              placeholder="Buscar docente o coordinador..."
              options={docenteOptions}
              selected={docente}
              onChange={setDocente}
            />
          )}

          <AutocompleteInput
            label="Alumnos"
            placeholder={
              peopleLoading
                ? 'Cargando alumnos...'
                : 'Buscar y agregar alumnos...'
            }
            options={alumnoOptions}
            multiple
            selected={numeroEstudiantes}
            onChange={setNumeroEstudiantes}
          />

          {peopleError && <p className="create-group-error">{peopleError}</p>}
          {error && <p className="create-group-error">{error}</p>}

          <article className="create-group-actions">
            <button
              type="button"
              className="create-group-cancel"
              onClick={onClose}
            >
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