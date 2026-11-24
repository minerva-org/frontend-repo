import type { EstadisticasMateria } from '../../types/EstadisticasTypes';

interface ListaFocoMateriasProps {
  materias: EstadisticasMateria[];
}

export default function ListaFocoMaterias({ materias }: ListaFocoMateriasProps) {
  const filas = materias
    .filter((m) => m.intentosFinalizados > 0)
    .map((m) => ({
      ...m,
      porIntento: m.incidenciasFoco / m.intentosFinalizados,
    }))
    .sort((a, b) => b.porIntento - a.porIntento);

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
          Materias con mayor pérdida de foco
        </h3>

        <p
          className="small mb-3"
          style={{ color: 'var(--seige-texto-secundario)' }}
        >
          Incidencias de foco por intento finalizado.
        </p>

        <article style={{ maxHeight: '260px', overflowY: 'auto' }}>
          {filas.length > 0 ? (
            filas.map((m) => (
              <article
                key={m.materiaId}
                className="d-flex align-items-center justify-content-between gap-3 border rounded-3 p-2 mb-2"
                style={{ borderColor: 'var(--seige-borde)' }}
              >
                <article className="min-w-0">
                  <p
                    className="mb-0 small fw-semibold text-truncate"
                    style={{ color: 'var(--ar-profundo)' }}
                  >
                    {m.nombreMateria}
                  </p>
                  <p
                    className="mb-0"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--seige-texto-secundario)',
                    }}
                  >
                    {m.incidenciasFoco} incidencias en {m.intentosFinalizados}{' '}
                    {m.intentosFinalizados === 1 ? 'intento' : 'intentos'}
                  </p>
                </article>

                <span
                  className="badge rounded-pill text-nowrap"
                  style={{
                    backgroundColor: 'var(--seige-fondo)',
                    color:
                      m.porIntento > 0
                        ? 'var(--seige-alerta)'
                        : 'var(--seige-exito)',
                    border: '1px solid var(--seige-borde)',
                  }}
                >
                  {m.porIntento.toFixed(1)} / intento
                </span>
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
              No hay intentos registrados por materia.
            </article>
          )}
        </article>
      </article>
    </section>
  );
}