import { useEffect, useState, type SubmitEvent } from 'react';
import { apiClient } from '../services/ApiClient';
import AutocompleteInput from './AutoCompleteInput.tsx';
import { fetchPersonas}  from '../services/personaService';
import { useAuth } from '../context/AuthContext.tsx';
import type { NewGroupData } from '../types/GrupoTypes.ts';
import '../styles/ModalGrupos.css';

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
  const { email } = useAuth();
  const [materia, setMateria] = useState<string[]>([]);
  const [claveGrupo, setClaveGrupo] = useState('');
  const [semestre, setSemestre] = useState('');
  const [materiasBD, setMateriasBD] = useState<string[]>([]);
  const [creatorPlantelId, setCreatorPlantelId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCreator() {
      if (!email) {
        setCreatorPlantelId(null);
        return;
      }

      try {
        const response = await fetchPersonas();
        const creator = (response.data ?? []).find(
          (persona) =>
            normalize(persona.email) === normalize(email),
        );


        setCreatorPlantelId(creator?.plantelId ?? null);
      } catch {
        setCreatorPlantelId(null);
      }
    }

    void loadCreator();
  }, [email]);



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


  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!materia[0] || !claveGrupo.trim() || !semestre.trim()) {
      setError('Captura materia, clave del grupo y semestre.');
      return;
    }

    if (!creatorPlantelId) {
      setError('No se pudo determinar el plantel del creador del grupo.');
      return;
    }



    const payload: NewGroupData = {
      grupo: materia[0],
      claveGrupo: claveGrupo.trim(),
      grado: semestre.trim(),
      materia: materia[0],
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