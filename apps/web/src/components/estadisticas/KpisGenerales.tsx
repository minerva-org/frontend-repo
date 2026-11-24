import TarjetaEstadistica from './TarjetaEstadistica';
import type { EstadisticasGenerales } from '../../types/EstadisticasTypes';

interface KpisGeneralesProps {
  datos: EstadisticasGenerales;
}

export default function KpisGenerales({ datos }: KpisGeneralesProps) {
  return (
    <section className="row g-3 mb-4">
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

      <article className="col-12 col-sm-6 col-xl-3">
        <TarjetaEstadistica
          titulo="Incidencias de foco"
          valor={datos.incidenciasFoco}
          descripcion={`En ${datos.intentosFinalizados} intentos finalizados`}
          colorValor="var(--seige-alerta)"
        />
      </article>

      <article className="col-12 col-sm-6 col-xl-3">
        <TarjetaEstadistica
          titulo="Alumnos evaluados"
          valor={datos.alumnosEvaluados}
          descripcion="Alumnos que realizaron evaluaciones"
        />
      </article>
    </section>
  );
}