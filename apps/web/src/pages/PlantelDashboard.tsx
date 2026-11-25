import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExplicacionIncidenciasFoco from '../components/estadisticas/ExplicacionIncidenciasFoco';
import MinervaMetricsAssistant from '../components/estadisticas/MinervaMetricsAssistant';
import AppPageHeader from '../components/common/AppPageHeader.tsx';
import GraficaRendimiento from '../components/estadisticas/GraficaRendimiento';
import GraficaResultados from '../components/estadisticas/GraficaResultados';
import KpisGenerales from '../components/estadisticas/KpisGenerales';
import { useAuth } from '../context/AuthContext';
import { fetchPersonaActual } from '../services/personaService';
import { obtenerEstadisticasPlantel } from '../services/estadisticasService';
import type { EstadisticasPlantel } from '../types/EstadisticasTypes';

export default function PlantelDashboard() {
  const [params] = useSearchParams();
  const { selectedPlantel } = useAuth();
  const idParam = params.get('plantelId');
  const [plantelId, setPlantelId] = useState(
    Number(idParam ?? selectedPlantel?.id),
  );
  const [datos, setDatos] = useState<EstadisticasPlantel | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let active = true;
    setCargando(true);
    setError('');

    const cargarPlantel = async () => {
      let id = plantelId;
      if (!Number.isInteger(id) || id <= 0) {
        const persona = await fetchPersonaActual();
        id = Number(persona.data?.plantelId);
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('No se pudo determinar el plantel.');
        }
        if (active) setPlantelId(id);
      }
      return obtenerEstadisticasPlantel(id);
    };

    cargarPlantel()
      .then((resultado) => {
        if (active) setDatos(resultado);
      })
      .catch(() => {
        if (active) setError('No fue posible cargar las métricas del plantel.');
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [plantelId]);

  if (cargando) {
    return (
      <>
        <AppPageHeader title="Métricas del plantel" />
        <main className="container-fluid p-4 text-secondary">
          Cargando métricas del plantel...
        </main>
      </>
    );
  }

  if (error || !datos) {
    return (
      <>
        <AppPageHeader title="Métricas del plantel" />
        <main className="container-fluid p-4">
        <p className="alert alert-danger" role="alert">
          {error || 'No hay métricas disponibles para este plantel.'}
        </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppPageHeader title="Métricas del plantel" />
      <main
      className="container-fluid p-4"
      style={{ backgroundColor: 'var(--seige-fondo)', minHeight: '100%' }}
    >
      <header className="mb-4">
        <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Métricas del plantel
        </h1>
        <p className="mb-0 text-secondary">{datos.nombrePlantel}</p>
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

      <section className="card border rounded-3 shadow-sm mb-4"
        style={{ backgroundColor: 'var(--seige-superficie)', borderColor: 'var(--seige-borde)' }}>
        <article className="card-body p-3">
          <h2 className="h6 fw-bold mb-3" style={{ color: 'var(--ar-profundo)' }}>
            Resumen de intentos
          </h2>
          <article className="row g-3 text-center">
            {[
              ['Intentos finalizados', datos.intentosFinalizados],
              ['Aprobados', datos.intentosAprobados],
              ['Reprobados', datos.intentosReprobados],
              ['Aprobación', `${datos.porcentajeAprobacion.toFixed(1)}%`],
              ['Reprobación', `${datos.porcentajeReprobacion.toFixed(1)}%`],
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

      <ExplicacionIncidenciasFoco />
      <MinervaMetricsAssistant
        scope="PLANTEL"
        entityId={String(datos.plantelId)}
      />
      </main>
    </>
  );
}
