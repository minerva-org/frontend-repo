import type {
  ConceptoCatalogo,
  CurriculoGrupoCatalogo,
  TemaCatalogo,
  UnidadCatalogo,
} from '../types/QuizTypes';

export function mapearCurriculoQuiz(curriculo: CurriculoGrupoCatalogo): {
  unidades: UnidadCatalogo[];
  temas: TemaCatalogo[];
  conceptos: ConceptoCatalogo[];
} {
  const unidades: UnidadCatalogo[] = (curriculo.unidades ?? [])
    .filter((unidad) => unidad.activo !== false)
    .map((unidad) => ({
      id: unidad.id,
      nombre: unidad.nombre,
      idMateria: unidad.idMateria ?? curriculo.idGrupo,
    }));

  const temas: TemaCatalogo[] = (curriculo.unidades ?? [])
    .filter((unidad) => unidad.activo !== false)
    .flatMap((unidad) =>
      (unidad.temas ?? [])
        .filter((tema) => tema.activo !== false)
        .map((tema) => ({
          id: tema.id,
          nombre: tema.nombre,
          unidadId: unidad.id,
        })),
    );

  const conceptos: ConceptoCatalogo[] = (curriculo.unidades ?? [])
    .filter((unidad) => unidad.activo !== false)
    .flatMap((unidad) =>
      (unidad.temas ?? [])
        .filter((tema) => tema.activo !== false)
        .flatMap((tema) =>
          (tema.conceptos ?? [])
            .filter((concepto) => concepto.activo !== false)
            .map((concepto) => ({
              id: concepto.id,
              nombre: concepto.nombre,
              temaId: tema.id,
              idConceptoOrigen: concepto.idConceptoOrigen,
            })),
        ),
    );

  return { unidades, temas, conceptos };
}
