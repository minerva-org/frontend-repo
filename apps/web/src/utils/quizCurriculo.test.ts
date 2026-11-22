import { describe, expect, it } from 'vitest';
import type { CurriculoGrupoCatalogo } from '../types/QuizTypes';
import { mapearCurriculoQuiz } from './quizCurriculo';

describe('mapearCurriculoQuiz', () => {
  // Input: currículo válido con unidad, tema y concepto activos.
  // Resultado esperado: genera catálogos asociados por ID.
  it('convierte el currículo completo del grupo', () => {
    const curriculo: CurriculoGrupoCatalogo = {
      idGrupo: 'GRP-1',
      unidades: [{
        id: 'UG-1',
        nombre: 'Unidad',
        idMateria: 'MAT-1',
        activo: true,
        temas: [{
          id: 'TG-1',
          nombre: 'Tema',
          idUnidadGrupo: 'UG-1',
          activo: true,
          conceptos: [{
            id: 'CG-1',
            nombre: 'Concepto',
            idTemaGrupo: 'TG-1',
            activo: true,
            contenidos: [],
          }],
        }],
      }],
      fuentes: [],
    };

    const result = mapearCurriculoQuiz(curriculo);

    expect(result.unidades).toEqual([{
      id: 'UG-1',
      nombre: 'Unidad',
      idMateria: 'MAT-1',
    }]);
    expect(result.temas[0]).toEqual({
      id: 'TG-1',
      nombre: 'Tema',
      unidadId: 'UG-1',
    });
    expect(result.conceptos[0]).toEqual({
      id: 'CG-1',
      nombre: 'Concepto',
      temaId: 'TG-1',
      idConceptoOrigen: undefined,
    });
  });

  // Input: unidades, temas o conceptos inactivos.
  // Resultado esperado: excluye nodos inactivos.
  it('filtra nodos inactivos', () => {
    const curriculo: CurriculoGrupoCatalogo = {
      idGrupo: 'GRP-1',
      unidades: [{
        id: 'UG-1',
        nombre: 'Unidad activa',
        activo: true,
        temas: [{
          id: 'TG-1',
          nombre: 'Tema inactivo',
          idUnidadGrupo: 'UG-1',
          activo: false,
          conceptos: [{
            id: 'CG-1',
            nombre: 'Concepto',
            idTemaGrupo: 'TG-1',
            activo: true,
            contenidos: [],
          }],
        }],
      }],
      fuentes: [],
    };

    const result = mapearCurriculoQuiz(curriculo);

    expect(result.unidades).toHaveLength(1);
    expect(result.temas).toHaveLength(0);
    expect(result.conceptos).toHaveLength(0);
  });

  // Input: currículo sin unidades.
  // Resultado esperado: catálogos vacíos.
  it('devuelve catálogos vacíos sin unidades', () => {
    const result = mapearCurriculoQuiz({
      idGrupo: 'GRP-1',
      unidades: [],
      fuentes: [],
    });

    expect(result).toEqual({
      unidades: [],
      temas: [],
      conceptos: [],
    });
  });

  it('conserva la relacion del concepto de grupo con su concepto base', () => {
    const curriculo: CurriculoGrupoCatalogo = {
      idGrupo: 'GRP-1',
      unidades: [{
        id: 'UG-1',
        nombre: 'Unidad',
        activo: true,
        temas: [{
          id: 'TG-1',
          nombre: 'Tema',
          idUnidadGrupo: 'UG-1',
          activo: true,
          conceptos: [{
            id: 'CG-1',
            nombre: 'Concepto',
            idTemaGrupo: 'TG-1',
            idConceptoOrigen: 'CON-1',
            activo: true,
            contenidos: [],
          }],
        }],
      }],
      fuentes: [],
    };

    const result = mapearCurriculoQuiz(curriculo);

    expect(result.conceptos[0]).toEqual({
      id: 'CG-1',
      nombre: 'Concepto',
      temaId: 'TG-1',
      idConceptoOrigen: 'CON-1',
    });
  });
});
