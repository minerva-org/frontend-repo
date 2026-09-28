import { useMemo, useState } from 'react';
import ModalMateria, { type DatosMateria } from '../components/ModalMateria.tsx';
import type { Materia } from '../types.ts';

const MATERIAS_MOCK: Materia[] = [
  {
    id: 'm1',
    nombre: 'Matemáticas 3',
    planEstudioNombre: 'plan-mat3-2026.pdf',
    status: 'Activa',
    unidades: [
      {
        id: 'm1-u1',
        nombre: 'Álgebra lineal',
        temas: [
          {
            id: 'm1-u1-t1',
            nombre: 'Matrices',
            conceptos: [
              { id: 'm1-u1-t1-c1', nombre: 'Suma de matrices' },
              { id: 'm1-u1-t1-c2', nombre: 'Determinante' },
            ],
          },
          { id: 'm1-u1-t2', nombre: 'Sistemas de ecuaciones', conceptos: [] },
        ],
      },
      {
        id: 'm1-u2',
        nombre: 'Cálculo diferencial',
        temas: [{ id: 'm1-u2-t1', nombre: 'Límites', conceptos: [] }],
      },
    ],
  },
  {
    id: 'm2',
    nombre: 'Física 2',
    planEstudioNombre: 'plan-fis2-2026.pdf',
    status: 'Activa',
    unidades: [
      {
        id: 'm2-u1',
        nombre: 'Electromagnetismo',
        temas: [{ id: 'm2-u1-t1', nombre: 'Ley de Coulomb', conceptos: [] }],
      },
    ],
  },
  {
    id: 'm3',
    nombre: 'Química 1',
    planEstudioNombre: null,
    status: 'Inactiva',
    unidades: [],
  },
];

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

type EstadoModal = { tipo: 'nueva' } | { tipo: 'editar'; materia: Materia } | null;

export default function Materias() {
  const [materias, setMaterias] = useState<Materia[]>(MATERIAS_MOCK);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<EstadoModal>(null);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return materias;
    return materias.filter(
      (m) =>
        normalizar(m.nombre).includes(q) ||
        normalizar(m.planEstudioNombre ?? '').includes(q) ||
        normalizar(m.status).startsWith(q),
    );
  }, [materias, busqueda]);

  const contarTemas = (m: Materia) => m.unidades.reduce((acc, u) => acc + u.temas.length, 0);

  const handleGuardar = (datos: DatosMateria) => {
    // TODO backend: multipart/form-data con datos.planArchivo (File) + JSON de unidades
    console.log('Guardar materia', datos);

    if (modal?.tipo === 'editar') {
      const id = modal.materia.id;
      setMaterias((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                nombre: datos.nombre,
                unidades: datos.unidades,
                planEstudioNombre: datos.planArchivo ? datos.planArchivo.name : m.planEstudioNombre,
              }
            : m,
        ),
      );
    } else {
      setMaterias((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          nombre: datos.nombre,
          unidades: datos.unidades,
          planEstudioNombre: datos.planArchivo?.name ?? null,
          status: 'Activa',
        },
      ]);
    }
    setModal(null);
  };

  const cambiarStatus = (m: Materia) => {
    if (m.status === 'Activa') {
      const ok = window.confirm(
        `¿Desactivar "${m.nombre}"? No se podrán crear grupos nuevos con esta materia.`,
      );
      if (!ok) return;
    }
    // TODO backend: PATCH /materias/:id/status
    setMaterias((prev) =>
      prev.map((x) =>
        x.id === m.id ? { ...x, status: x.status === 'Activa' ? 'Inactiva' : 'Activa' } : x,
      ),
    );
  };

  return (
    <main>
      <header>
        <article>
          <h1>Catálogo de materias</h1>
          <p>
            {materias.length} {materias.length === 1 ? 'materia' : 'materias'}
          </p>
        </article>
        <button type="button" onClick={() => setModal({ tipo: 'nueva' })}>
          + Nueva materia
        </button>
      </header>

      <article>
        <i className="bi bi-search" aria-hidden="true" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, plan o estado"
          aria-label="Buscar materias"
        />
      </article>

      {filtradas.length === 0 ? (
        <p>
          {busqueda
            ? `No hay materias que coincidan con "${busqueda}".`
            : 'Aún no hay materias. Crea la primera con "Nueva materia".'}
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Materia</th>
              <th scope="col">Plan de estudio</th>
              <th scope="col">Unidades / Temas</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((m) => (
              <tr key={m.id}>
                <td>{m.nombre}</td>
                <td>
                  {m.planEstudioNombre ? (
                    <>
                      <i className="bi bi-file-earmark-pdf" aria-hidden="true" /> {m.planEstudioNombre}
                    </>
                  ) : (
                    'Sin plan'
                  )}
                </td>
                <td>
                  {m.unidades.length} / {contarTemas(m)}
                </td>
                <td>{m.status}</td>
                <td>
                  <button type="button" onClick={() => setModal({ tipo: 'editar', materia: m })}>
                    <i className="bi bi-pencil" aria-hidden="true" /> Editar
                  </button>{' '}
                  <button type="button" onClick={() => cambiarStatus(m)}>
                    {m.status === 'Activa' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <ModalMateria
          // key para que el estado interno se reinicie al cambiar de materia
          key={modal.tipo === 'editar' ? modal.materia.id : 'nueva'}
          materia={modal.tipo === 'editar' ? modal.materia : null}
          onCerrar={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </main>
  );
}
