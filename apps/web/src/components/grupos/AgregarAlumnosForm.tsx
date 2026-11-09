import { useMemo, useState, type SubmitEvent } from 'react';
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (seleccionados.length === 0) {
      setError('Selecciona al menos un alumno.');
      return;
    }

    onSubmit(seleccionados);
  }

  return (
    <article
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="agregar-alumnos-title"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
    >
      <article className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <article className="modal-content border-0 shadow">

          <article
            className="modal-header text-white"
            style={{
              background: 'linear-gradient(135deg, var(--ar-profundo), var(--ar-azul))',
              borderBottom: 'none',
            }}
          >
            <article>
              <h5 className="modal-title fw-bold" id="agregar-alumnos-title">
                Agregar alumnos al grupo
              </h5>
              <p className="small mb-0" style={{ color: 'var(--ar-neblina)' }}>
                Busca y selecciona los alumnos que deseas incorporar.
              </p>
            </article>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCancel}
              aria-label="Cerrar"
            />
          </article>

          <form onSubmit={handleSubmit}>
            <article className="modal-body">

              <label htmlFor="buscar-alumno" className="form-label fw-semibold">
                Buscar alumnos
              </label>

              <input
                id="buscar-alumno"
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, apellidos o correo..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                autoComplete="off"
              />

              {busqueda.trim() !== '' && (
                <article className="list-group mt-2">
                  {alumnosFiltrados.length > 0 ? (
                    alumnosFiltrados.map((alumno) => (
                      <button
                        key={alumno.id}
                        type="button"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => agregarAlumno(alumno.id)}
                      >
                        <strong>{nombreCompleto(alumno)}</strong>
                        <small className="text-secondary">{alumno.email}</small>
                      </button>
                    ))
                  ) : (
                    <p className="text-secondary mt-2 mb-0">
                      No se encontraron alumnos disponibles.
                    </p>
                  )}
                </article>
              )}

              <hr />

              <h6 className="fw-bold mb-3">
                Alumnos seleccionados ({alumnosElegidos.length})
              </h6>

              {alumnosElegidos.length > 0 ? (
                <article className="d-flex flex-wrap gap-2">
                  {alumnosElegidos.map((alumno) => (
                    <span
                      key={alumno.id}
                      className="badge text-bg-primary d-flex align-items-center gap-2 p-2"
                    >
                      {nombreCompleto(alumno)}

                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => eliminarAlumno(alumno.id)}
                        aria-label={`Quitar a ${nombreCompleto(alumno)}`}
                      />
                    </span>
                  ))}
                </article>
              ) : (
                <p className="text-secondary mb-0">
                  Aún no has seleccionado alumnos.
                </p>
              )}

              {error && (
                <article className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </article>
              )}

            </article>

            <article className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={seleccionados.length === 0}
              >
                Agregar alumnos
              </button>
            </article>
          </form>

        </article>
      </article>
    </article>
  );
}