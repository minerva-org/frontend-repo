import TarjetaEstadistica from '../TarjetaEstadistica';
import GraficaAprobacionMaterias from '../GraficaAprobacionMaterias';
import ListaFocoMaterias from '../ListaFocoMateria';
import TablaGruposIntegridad from '../TablaGruposIntegridad';
import type { DatosVistaMetricas } from '../../../types/EstadisticasTypes';

type VistaCoordinadorProps = DatosVistaMetricas & { esDocente?: boolean };

export default function VistaCoordinador({
  datos,
  materias,
  resumenGrupos,
  esDocente = false,
}: VistaCoordinadorProps) {
  const docentesActivos = new Set(
    resumenGrupos
      .map((g) => g.docenteId)
      .filter((id): id is string => id !== null)
  ).size;

  return (
    <>
      <section className="row g-3 mb-4">
        <article className="col-12 col-sm-6 col-xl-3">
          <TarjetaEstadistica
            titulo="Grupos activos"
            valor={resumenGrupos.length}
            descripcion={esDocente ? 'Grupos activos a tu cargo' : 'Grupos activos en el plantel'}
          />
        </article>

        <article className="col-12 col-sm-6 col-xl-3">
          {esDocente ? (
            <TarjetaEstadistica
              titulo="Promedio general"
              valor={`${datos.promedioGeneral.toFixed(1)}%`}
              descripcion="Calificación promedio"
            />
          ) : (
            <TarjetaEstadistica
              titulo="Docentes activos"
              valor={docentesActivos}
              descripcion="Docentes con grupos activos"
            />
          )}
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
            titulo="Alumnos evaluados"
            valor={datos.alumnosEvaluados}
            descripcion="Alumnos que realizaron evaluaciones"
          />
        </article>
      </section>

      <section className="row g-3 mb-4">
        <article className="col-12 col-xl-6">
          <GraficaAprobacionMaterias materias={materias} />
        </article>
        <article className="col-12 col-xl-6">
          <ListaFocoMaterias materias={materias} />
        </article>
      </section>

      <section className="row g-3 mb-4">
        <article className="col-12">
          <TablaGruposIntegridad grupos={resumenGrupos} />
        </article>
      </section>
    </>
  );
}