import { Link } from 'react-router-dom';
import type { EstadisticasGrupoResumen } from '../../types/EstadisticasTypes';

interface TablaGruposIntegridadProps {
  grupos: EstadisticasGrupoResumen[];
}

const SIN_DATO = '—';

const nombreDocente = (g: EstadisticasGrupoResumen) => {
  const nombre = [g.nombreDocente, g.apellidoPaterno, g.apellidoMaterno]
    .filter((parte) => parte && parte.trim() !== '')
    .join(' ');
  return nombre || SIN_DATO;
};

const estiloEncabezado = {
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
  color: 'var(--seige-texto-secundario)',
  backgroundColor: 'var(--seige-fondo)',
  borderColor: 'var(--seige-borde)',
};

export default function TablaGruposIntegridad({ grupos }: TablaGruposIntegridadProps) {
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
          Actividad e integridad por grupo
        </h3>

        <p className="small mb-3" style={{ color: 'var(--seige-texto-secundario)' }}>
          Seguimiento académico y comportamiento ante la prueba.
        </p>

        {grupos.length > 0 ? (
          <article className="table-responsive" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="table table-sm align-middle mb-0" style={{ color: 'var(--seige-texto)' }}>
              <thead>
                <tr>
                  <th className="text-uppercase fw-semibold" style={estiloEncabezado}>Grupo</th>
                  <th className="text-uppercase fw-semibold" style={estiloEncabezado}>Docente</th>
                  <th className="text-uppercase fw-semibold" style={estiloEncabezado}>Materia</th>
                  <th className="text-uppercase fw-semibold text-end" style={estiloEncabezado}>% Aprobados</th>
                  <th className="text-uppercase fw-semibold text-end" style={estiloEncabezado}>Salidas / alumno</th>
                  <th className="text-uppercase fw-semibold text-end" style={estiloEncabezado}>Intentos</th>
                </tr>
              </thead>

              <tbody>
                {grupos.map((g) => {
                  const hayIntentos = g.intentosFinalizados > 0;
                  const salidasPorAlumno =
                    g.alumnosEvaluados > 0 ? g.incidenciasFoco / g.alumnosEvaluados : null;

                  return (
                    <tr key={g.grupoId} style={{ borderColor: 'var(--seige-borde)' }}>
                      <td>
                        <Link
                          to={`/grupos/${g.grupoId}/metricas`}
                          className="fw-semibold text-decoration-none"
                          style={{ color: '#67b7f7' }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.color = '#3b9ee8';
                            event.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.color = '#67b7f7';
                            event.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          {g.nombreGrupo}
                        </Link>
                        <br />
                        <small style={{ color: 'var(--seige-texto-secundario)' }}>
                          {g.claveGrupo}
                        </small>
                      </td>

                      <td>{nombreDocente(g)}</td>

                      <td>{g.nombreMateria ?? SIN_DATO}</td>

                      <td
                        className="text-end fw-semibold"
                        style={{
                          color: hayIntentos
                            ? g.porcentajeAprobacion >= 70
                              ? 'var(--seige-exito)'
                              : 'var(--seige-alerta)'
                            : 'var(--seige-texto-secundario)',
                        }}
                      >
                        {hayIntentos ? `${g.porcentajeAprobacion.toFixed(1)}%` : SIN_DATO}
                      </td>

                      <td className="text-end">
                        {salidasPorAlumno !== null ? salidasPorAlumno.toFixed(1) : SIN_DATO}
                      </td>

                      <td className="text-end">{g.intentosFinalizados}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>
        ) : (
          <article
            className="d-flex align-items-center justify-content-center small"
            style={{ height: '200px', color: 'var(--seige-texto-secundario)' }}
          >
            No hay grupos activos para mostrar.
          </article>
        )}
      </article>
    </section>
  );
}