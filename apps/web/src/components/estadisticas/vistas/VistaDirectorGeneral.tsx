import TarjetaEstadistica from '../TarjetaEstadistica';
import GraficaAprobacionPlanteles from '../GraficaAprobacionPlanteles';
import GraficaTendencia from '../GraficaTendencia';
import type { DatosVistaMetricas } from '../../../types/EstadisticasTypes';

export default function VistaDireccionGeneral({
  datos,
  planteles,
  tendencia,
}: DatosVistaMetricas) {
  return (
    <>
      <section className="row g-3 mb-4">
        <article className="col-12 col-sm-6 col-xl-3">
          <TarjetaEstadistica
            titulo="Planteles"
            valor={planteles.length}
            descripcion="Planteles con evaluaciones finalizadas"
          />
        </article>

        <article className="col-12 col-sm-6 col-xl-3">
          <TarjetaEstadistica
            titulo="Alumnos evaluados"
            valor={datos.alumnosEvaluados}
            descripcion="Alumnos que realizaron evaluaciones"
          />
        </article>

        <article className="col-12 col-sm-6 col-xl-3">
          <TarjetaEstadistica
            titulo="Promedio general"
            valor={`${datos.promedioGeneral.toFixed(1)}%`}
            descripcion="Calificación promedio"
          />
        </article>

        <article className="col-12 col-sm-6 col-xl-3">
          <TarjetaEstadistica
            titulo="Índice de foco limpio"
            valor={`${datos.indiceFocoLimpio.toFixed(1)}%`}
            descripcion="Evaluaciones sin incidencias de foco"
          />
        </article>
      </section>

      <section className="row g-3 mb-4">
        <article className="col-12 col-xl-6">
          <GraficaAprobacionPlanteles planteles={planteles} />
        </article>
        <article className="col-12 col-xl-6">
          <GraficaTendencia quizzes={tendencia} />
        </article>
      </section>
    </>
  );
}