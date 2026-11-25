import KpisGenerales from '../KpisGenerales.tsx';
import GraficaTendencia from '../GraficaTendencia.tsx';
import ListaFocoMaterias from '../ListaFocoMateria.tsx';
import GraficaAprobacionMaterias from '../GraficaAprobacionMaterias.tsx';
import ActividadDocentes from '../ActividadDocentes.tsx';
import type { DatosVistaMetricas } from '../../../types/EstadisticasTypes.ts';

export default function VistaDirectorPlantel({
  datos,
  materias,
  docentes,
  tendencia,
}: DatosVistaMetricas) {
  return (
    <>
      <KpisGenerales datos={datos} />

      <section className="row g-3 mb-4">
        <article className="col-12 col-xl-6">
          <GraficaTendencia quizzes={tendencia} mostrarFechaCierre />
        </article>
        <article className="col-12 col-xl-6">
          <ListaFocoMaterias materias={materias} />
        </article>
      </section>

      <section className="row g-3 mb-4">
        <article className="col-12 col-xl-6">
          <GraficaAprobacionMaterias materias={materias} />
        </article>
        <article className="col-12 col-xl-6">
          <ActividadDocentes docentes={docentes} />
        </article>
      </section>
    </>
  );
}