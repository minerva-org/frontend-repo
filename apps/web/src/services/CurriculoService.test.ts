import { describe, expect, it } from 'vitest';
import {
  curriculoBackendToNode,
  curriculoNodeToBackendPayload,
} from './CurriculoService';

describe('CurriculoService', () => {
  it('adapta currículo backend anidado al nodo de canvas', () => {
    const node = curriculoBackendToNode(
      {
        idGrupo: 'GRP-1',
        unidades: [
          {
            id: 'UG-1',
            nombre: 'Estructuras lineales',
            temas: [
              {
                id: 'TG-1',
                nombre: 'Pilas',
                conceptos: [
                  {
                    id: 'CG-1',
                    nombre: 'Push',
                    contenidos: [
                      {
                        id: 'CTG-1',
                        descripcion: 'Inserta un elemento.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        fuentes: [],
      },
      'Estructura de Datos',
    );

    expect(node.tipo).toBe('materia');
    expect(node.hijos[0].tipo).toBe('unidad');
    expect(node.hijos[0].hijos[0].tipo).toBe('tema');
    expect(node.hijos[0].hijos[0].hijos[0].tipo).toBe('concepto');
    expect(node.hijos[0].hijos[0].hijos[0].contenido[0].descripcion)
      .toBe('Inserta un elemento.');
  });

  it('convierte nodos temporales sin IDs persistidos', () => {
    const node = {
      id: 'MAT-GRP-1',
      tipo: 'materia' as const,
      nombre: 'Materia',
      origen: 'materia' as const,
      revisionEstado: 'original' as const,
      contenido: [],
      hijos: [
        {
          id: 'TEMP-UG-1',
          tipo: 'unidad' as const,
          nombre: 'Unidad nueva',
          origen: 'usuario' as const,
          revisionEstado: 'nuevo' as const,
          contenido: [],
          hijos: [],
        },
      ],
    };

    const payload = curriculoNodeToBackendPayload('GRP-1', node);

    expect(payload.idGrupo).toBe('GRP-1');
    expect(payload.unidades[0].id).toBeNull();
    expect(payload.unidades[0].nombre).toBe('Unidad nueva');
  });

  it('conserva las unidades temas y conceptos del JSON real', () => {
    const node = curriculoBackendToNode(
      {
        idGrupo: 'GRP-SW-1',
        unidades: [
          {
            id: 'UG-GRP-SW-1-UNI-SW-1',
            nombre: 'Proceso de software',
            activo: true,
            temas: [
              {
                id: 'TG-UG-GRP-SW-1-UNI-SW-1-TEM-SW-1',
                nombre: 'Metodologías ágiles',
                activo: true,
                conceptos: [
                  {
                    id: 'CG-TG-UG-GRP-SW-1-UNI-SW-1-TEM-SW-1-CON-SW-1',
                    nombre: 'Scrum',
                    activo: true,
                    contenidos: [],
                  },
                ],
              },
            ],
          },
          {
            id: 'UG-GRP-SW-1-UNI-SW-2',
            nombre: 'Análisis y diseño',
            activo: true,
            temas: [
              {
                id: 'TG-UG-GRP-SW-1-UNI-SW-2-TEM-SW-2',
                nombre: 'Requisitos',
                activo: true,
                conceptos: [
                  {
                    id: 'CG-TG-UG-GRP-SW-1-UNI-SW-2-TEM-SW-2-CON-SW-2',
                    nombre: 'Historias de usuario',
                    activo: true,
                    contenidos: [],
                  },
                ],
              },
            ],
          },
        ],
        fuentes: [],
      },
      'Ingeniería de Software 1',
    );

    expect(node.hijos).toHaveLength(2);
    expect(node.hijos[0].hijos[0].nombre).toBe('Metodologías ágiles');
    expect(node.hijos[0].hijos[0].hijos[0].nombre).toBe('Scrum');
    expect(node.hijos[1].hijos[0].nombre).toBe('Requisitos');
    expect(node.hijos[1].hijos[0].hijos[0].nombre)
      .toBe('Historias de usuario');
  });

  it('excluye unidades temas y conceptos inactivos', () => {
    const node = curriculoBackendToNode(
      {
        idGrupo: 'GRP-1',
        unidades: [
          {
            id: 'UG-A',
            nombre: 'Activa',
            activo: true,
            temas: [
              {
                id: 'TG-I',
                nombre: 'Inactiva',
                activo: false,
                conceptos: [],
              },
              {
                id: 'TG-A',
                nombre: 'Activa',
                activo: true,
                conceptos: [
                  {
                    id: 'CG-I',
                    nombre: 'Concepto inactivo',
                    activo: false,
                    contenidos: [],
                  },
                ],
              },
            ],
          },
          {
            id: 'UG-I',
            nombre: 'Unidad inactiva',
            activo: false,
            temas: [],
          },
        ],
        fuentes: [],
      },
      'Materia',
    );

    expect(node.hijos).toHaveLength(1);
    expect(node.hijos[0].hijos).toHaveLength(1);
    expect(node.hijos[0].hijos[0].nombre).toBe('Activa');
    expect(node.hijos[0].hijos[0].hijos).toHaveLength(0);
  });
});
