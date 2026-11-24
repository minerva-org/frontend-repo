import type { EstadisticasDocente } from '../../types/EstadisticasTypes';

interface ActividadDocentesProps {
  docentes: EstadisticasDocente[];
}

const nombreCompleto = (d: EstadisticasDocente) =>
  [d.nombreDocente, d.apellidoPaterno, d.apellidoMaterno]
    .filter((parte) => parte && parte.trim() !== '')
    .join(' ');

export default function ActividadDocentes({ docentes }: ActividadDocentesProps) {
  const maximo = Math.max(...docentes.map((d) => d.quizzesAplicados), 1);

  return (
    <section
      className="card h-100 border rounded-3 shadow-sm"
      style={{
        backgroundColor: 'var(--seige-superficie)',
        borderColor: 'var(--seige-borde)',
      }}
    >
      <article className="card-body p-3">
        <h3 className="h6 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Actividad docente (últimos 30 días)
        </h3>

        <p
          className="small mb-3"
          style={{ color: 'var(--seige-texto-secundario)' }}
        >
          Quizzes cerrados por el docente.
        </p>

        <article style={{ maxHeight: '260px', overflowY: 'auto' }}>
          {docentes.length > 0 ? (
            docentes.map((d) => (
              <article key={d.docenteId} className="mb-3">
                <article className="d-flex justify-content-between small mb-1">
                  <span
                    className="text-truncate me-2"
                    style={{ color: 'var(--ar-profundo)' }}
                  >
                    {nombreCompleto(d)}
                  </span>
                  <span
                    className="fw-semibold"
                    style={{ color: 'var(--ar-profundo)' }}
                  >
                    {d.quizzesAplicados}
                  </span>
                </article>

                <article
                  className="progress"
                  style={{ height: '8px', backgroundColor: 'var(--seige-fondo)' }}
                >
                  <article
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${(d.quizzesAplicados / maximo) * 100}%`,
                      backgroundColor: 'var(--ar-azul)',
                    }}
                    aria-valuenow={d.quizzesAplicados}
                    aria-valuemin={0}
                    aria-valuemax={maximo}
                  />
                </article>
              </article>
            ))
          ) : (
            <article
              className="d-flex align-items-center justify-content-center small"
              style={{
                height: '200px',
                color: 'var(--seige-texto-secundario)',
              }}
            >
              No hay quizzes cerrados en los últimos 30 días.
            </article>
          )}
        </article>
      </article>
    </section>
  );
}