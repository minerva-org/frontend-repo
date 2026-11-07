import { useMemo, useState, type FormEvent } from 'react';
import type { PersonaRecord } from '../../types/PersonaTypes';

interface AgregarAlumnosFormProps {
  alumnos: PersonaRecord[];
  alumnosSeleccionados: string[];
  onSubmit: (alumnosIds: string[]) => void;
  onCancel?: () => void;
}

function nombreCompleto(alumno: PersonaRecord): string {
  return `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno ?? ''}`.trim();
}

function normalizeText(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  }

export default function AgregarAlumnosForm({
  alumnos,
  alumnosSeleccionados,
  onSubmit,
  onCancel,
}: AgregarAlumnosFormProps) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const alumnosFiltrados = useMemo(() => {
    const texto = normalizeText(busqueda);

    return alumnos.filter((alumno) => {
      if (alumnosSeleccionados.includes(alumno.id)) return false;
      if (seleccionados.includes(alumno.id)) return false;

      const nombre = normalizeText(nombreCompleto(alumno));
      const correo = normalizeText(alumno.email);

      return !texto || nombre.includes(texto) || correo.includes(texto);
    });
  }, [alumnos, alumnosSeleccionados, busqueda, seleccionados]);

  const alumnosElegidos = useMemo(
    () => alumnos.filter((alumno) => seleccionados.includes(alumno.id)),
    [alumnos, seleccionados]
  );

  function agregarAlumno(id: string) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
    setBusqueda('');
    setError(null);
  }

  function eliminarAlumno(id: string) {
    setSeleccionados((prev) => prev.filter((alumnoId) => alumnoId !== id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (seleccionados.length === 0) {
      setError('Selecciona al menos un alumno.');
      return;
    }

    onSubmit(seleccionados);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="buscar-alumno">
        Buscar alumnos
      </label>

      <input
        id="buscar-alumno"
        type="text"
        placeholder="Buscar por nombre, apellidos o correo..."
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        autoComplete="off"
      />

      {busqueda.trim() !== '' && (
        <section>
          {alumnosFiltrados.length > 0 ? (
            alumnosFiltrados.map((alumno) => (
              <button
                key={alumno.id}
                type="button"
                onClick={() => agregarAlumno(alumno.id)}
              >
                <strong>{nombreCompleto(alumno)}</strong>
                <span>{alumno.email}</span>
              </button>
            ))
          ) : (
            <p>No se encontraron alumnos disponibles.</p>
          )}
        </section>
      )}

      <section>
        <h3>Alumnos seleccionados ({alumnosElegidos.length})</h3>

        {alumnosElegidos.length > 0 ? (
          <article>
            {alumnosElegidos.map((alumno) => (
              <span key={alumno.id}>
                {nombreCompleto(alumno)}
                <button
                  type="button"
                  onClick={() => eliminarAlumno(alumno.id)}
                  aria-label={`Quitar a ${nombreCompleto(alumno)}`}
                >
                </button>
              </span>
            ))}
          </article>
        ) : (
          <p>Aún no has seleccionado alumnos.</p>
        )}
      </section>

      {error && <p role="alert">{error}</p>}

      <section>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}

        <button type="submit" disabled={seleccionados.length === 0}>
          Agregar alumnos
        </button>
      </section>
    </form>
  );
}