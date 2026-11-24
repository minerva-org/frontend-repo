import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GraficaRendimiento from '../components/estadisticas/GraficaRendimiento';
import GraficaResultados from '../components/estadisticas/GraficaResultados';
import GraficaTendencia from '../components/estadisticas/GraficaTendencia';
import KpisGenerales from '../components/estadisticas/KpisGenerales';
import ExplicacionIncidenciasFoco from '../components/estadisticas/ExplicacionIncidenciasFoco';
import MinervaMetricsAssistant from '../components/estadisticas/MinervaMetricsAssistant';
import { apiClient } from '../services/ApiClient';
import {
  obtenerEstadisticasGrupo,
  obtenerTendenciaAprobacionGrupo,
} from '../services/estadisticasService';
import type {
  EstadisticasGrupo,
  EstadisticasTendencia,
} from '../types/EstadisticasTypes';
import type { GrupoDetalleBackend } from '../types/GrupoTypes';

export default function MetricasGrupo() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<EstadisticasGrupo | null>(null);
  const [tendencia, setTendencia] = useState<EstadisticasTendencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;

    let active = true;
    setCargando(true);
    setError('');

    Promise.allSettled([
      obtenerEstadisticasGrupo(code),
      obtenerTendenciaAprobacionGrupo(code),
      apiClient.get<GrupoDetalleBackend>(`/api/grupos/${encodeURIComponent(code)}`),
    ])
      .then(([metricas, tendenciaGrupo, grupo]) => {
        if (!active) return;
        if (tendenciaGrupo.status === 'fulfilled') {
          setTendencia(tendenciaGrupo.value);
        }
        if (metricas.status === 'fulfilled') {
          setDatos(metricas.value);
          return;
        }
        if (grupo.status === 'fulfilled') {
          const info = grupo.value.data;
          setDatos({
            grupoId: info.id,
            nombreGrupo: info.nombre,
            claveGrupo: info.claveGrupo,
            semestre: info.semestre,
            promedioGeneral: 0,
            porcentajeAprobacion: 0,
            porcentajeReprobacion: 0,
            indiceFocoLimpio: 0,
            alumnosEvaluados: 0,
            quizzesAplicados: 0,
            intentosFinalizados: 0,
            incidenciasFoco: 0,
            intentosAprobados: 0,
            intentosReprobados: 0,
          });
          setError('Las métricas no están disponibles temporalmente; se muestran valores en cero.');
          return;
        }
        setError('No fue posible cargar el grupo ni sus métricas.');
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, [code]);

  const volverAlGrupo = () => navigate(`/grupos/${code ?? ''}`);
  const nombreGrupo = datos?.nombreGrupo || 'Grupo';

  if (cargando) {
    return (
      <main className="container-fluid p-4">
        <p className="text-secondary">Cargando métricas del grupo...</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="container-fluid p-4">
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none mb-4"
          onClick={volverAlGrupo}
        >
          <i className="bi bi-arrow-left me-2" />
          {nombreGrupo}
        </button>
        <p className="alert alert-danger" role="alert">
          {error || 'No hay métricas disponibles.'}
        </p>
      </main>
    );
  }

  return (
    <main
      className="container-fluid p-4"
      style={{ backgroundColor: 'var(--seige-fondo)', minHeight: '100%' }}
    >
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none mb-4"
        onClick={volverAlGrupo}
      >
        <i className="bi bi-arrow-left me-2" />
        {datos.nombreGrupo}
      </button>

      {error && (
        <p className="alert alert-warning" role="status">
          {error}
        </p>
      )}

      <header className="mb-4">
        <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Métricas del grupo
        </h1>
        <p className="mb-0 text-secondary">
          {datos.claveGrupo} · {datos.semestre} · {datos.quizzesAplicados}{' '}
          {datos.quizzesAplicados === 1 ? 'quiz aplicado' : 'quizzes aplicados'}
        </p>
      </header>

      <KpisGenerales datos={datos} />

      <section className="row g-3 mb-4">
        <article className="col-12 col-xl-6">
          <GraficaRendimiento
            promedio={datos.promedioGeneral}
            aprobacion={datos.porcentajeAprobacion}
            focoLimpio={datos.indiceFocoLimpio}
          />
        </article>
        <article className="col-12 col-xl-6">
          <GraficaResultados
            aprobados={datos.intentosAprobados}
            reprobados={datos.intentosReprobados}
          />
        </article>
      </section>

      <section className="mb-4">
        <GraficaTendencia quizzes={tendencia} />
      </section>

      <section
        className="card border rounded-3 shadow-sm"
        style={{
          backgroundColor: 'var(--seige-superficie)',
          borderColor: 'var(--seige-borde)',
        }}
      >
        <article className="card-body p-3">
          <h2 className="h6 fw-bold mb-3" style={{ color: 'var(--ar-profundo)' }}>
            Resumen de intentos
          </h2>
          <article className="row g-3 text-center">
            {[
              ['Intentos finalizados', datos.intentosFinalizados],
              ['Aprobados', datos.intentosAprobados],
              ['Reprobados', datos.intentosReprobados],
              ['% de aprobación', `${datos.porcentajeAprobacion.toFixed(1)}%`],
              ['% de reprobación', `${datos.porcentajeReprobacion.toFixed(1)}%`],
            ].map(([etiqueta, valor]) => (
              <article className="col-6 col-md" key={etiqueta}>
                <p className="mb-1 small text-secondary">{etiqueta}</p>
                <p className="mb-0 h4 fw-bold" style={{ color: 'var(--ar-profundo)' }}>
                  {valor}
                </p>
              </article>
            ))}
          </article>
        </article>
      </section>

      <section className="mt-4">
        <ExplicacionIncidenciasFoco />
      </section>

      <MinervaMetricsAssistant scope="GRUPO" entityId={code} />
    </main>
  );
}
