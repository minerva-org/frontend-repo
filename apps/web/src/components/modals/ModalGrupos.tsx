import { useEffect, useState, type SubmitEvent } from 'react';
import { apiClient } from '../../services/ApiClient';
import AutocompleteInput from '.././AutoCompleteInput.tsx';
import { fetchPersonas,type PersonaRecord}  from '../../services/personaService';
import { useAuth } from '../../context/AuthContext.tsx';
import type { NewGroupData } from '../../types/GrupoTypes.ts';
import '../../styles/ModalGrupos.css';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (data: NewGroupData) => Promise<void> | void;
}

interface MateriaBackend {
  id: string;
  nombre: string;
}

const normalize = (value: unknown) =>
  String(value ?? '').trim().toLowerCase();

export default function CreateGroupModal({
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const { email, selectedPlantel } = useAuth();
  const [materia, setMateria] = useState<string[]>([]);
  const [claveGrupo, setClaveGrupo] = useState('');
  const [semestre, setSemestre] = useState('');
  const [materiasBD, setMateriasBD] = useState<MateriaBackend[]>([]);
  const [creatorPlantelId, setCreatorPlantelId] = useState<number | null>(null);
  const [docentes, setDocentes] = useState<PersonaRecord[]>([]);
  const [docenteId, setDocenteId] = useState(''); 
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCreator() {
      if (!email) {
        setCreatorPlantelId(null);
        return;
      }

      try {
        const response = await fetchPersonas();
        const personas = response.data ?? [];

        const creator = personas.find(
          (persona) => normalize(persona.email) === normalize(email),
        );

        const plantelId = selectedPlantel?.id ?? creator?.plantelId ?? null;

        setCreatorPlantelId(plantelId);

        const docentesDisponibles = personas.filter(
          (persona) =>
            persona.rol === 'DOCENTE' &&
            persona.activo === true &&
            persona.plantelId === plantelId,
        );

        setDocentes(docentesDisponibles);
      } catch {
        setCreatorPlantelId(null);
        setDocentes([]);
        setError('No se pudieron cargar los docentes');
      }
    }

    void loadCreator();
  }, [email, selectedPlantel?.id],);



  useEffect(() => {
    async function loadMaterias() {
      try {
        const response = await apiClient.get<MateriaBackend[]>(
          '/api/materias',
        );

        setMateriasBD(response.data ?? []);
      } catch {
        setMateriasBD([]);
        setError('No se pudieron cargar las materias.');
      }
    }

    void loadMaterias();
  }, []);


  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!materia[0] || !claveGrupo.trim() || !semestre.trim()) {
      setError('Captura materia, clave del grupo y semestre.');
      return;
    }

    const materiaSeleccionada = materiasBD.find(
      (item) => item.nombre === materia[0],
    );

    if (!materiaSeleccionada) {
      setError('Selecciona una materia válida.');
      return;
    }

    if (!creatorPlantelId) {
      setError('No se pudo determinar el plantel del creador del grupo.');
      return;
    }

    if (!docenteId) {
      setError('Selecciona un docente para el grupo.');
      return;
    }



    const docenteSeleccionado = docentes.find(
      (docente) => docente.id === docenteId,
    );

    if (!docenteSeleccionado){
      setError('El docente seleccionado no es válido.')
      return;
    }

    const payload: NewGroupData = {
      grupo: materia[0],
      claveGrupo: claveGrupo.trim(),
      grado: semestre.trim(),
      docente: `${docenteSeleccionado.nombre} ${docenteSeleccionado.apellidoPaterno}`,
      docenteId,
      materia: materia[0],
      materiaId: materiaSeleccionada.id,
      alumnosIds: [],
      numeroEstudiantes: [],
      plantelId: creatorPlantelId,
    };


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
            options={materiasBD.map((item) => item.nombre)}
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

            <label className="create-group-field">
            <span className="create-group-label">Docente asignado</span>
            <select
              className="create-group-input"
              value={docenteId}
              onChange={(event) => setDocenteId(event.target.value)}
              required
            >
              <option value="">Selecciona un docente</option>

              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.nombre} {docente.apellidoPaterno}{' '}
                  {docente.apellidoMaterno ?? ''}
                </option>
              ))}
            </select>

            {docentes.length === 0 && (
              <small>No hay docentes activos disponibles en este plantel.</small>
            )}
          </label>

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