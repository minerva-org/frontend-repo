import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSidebar } from '../context/SidebarContext.tsx';
import ModalMateria, { type DatosMateria } from '../components/ModalMateria.tsx';
import type { Materia } from '../types.ts';
import '../styles/Materias.css';

const MATERIAS_MOCK: Materia[] = [
  {
    id: 'm1',
    nombre: 'Matemáticas III',
    planEstudioNombre: 'plan_matematicas_iii.pdf',
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
    ],
  },
  {
    id: 'm2',
    nombre: 'Física II',
    planEstudioNombre: null,
    status: 'Activa',
    unidades: [],
  },
  {
    id: 'm3',
    nombre: 'Ética',
    planEstudioNombre: 'plan_etica.pdf',
    status: 'Inactiva',
    unidades: [
      {
        id: 'm3-u1',
        nombre: 'Fundamentos',
        temas: [{ id: 'm3-u1-t1', nombre: 'Valores', conceptos: [] }],
      },
    ],
  },
];


const ETIQUETA_ROL: Record<string, string> = {
  coordinador: 'Coordinador',
  directorPlanta: 'Director de Plantel',
  directorGeneral: 'Director General',
  docente: 'Docente',
  dev: 'Desarrollo',
};

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

type EstadoModal = { tipo: 'nueva' } | { tipo: 'editar'; materia: Materia } | null;

export default function Materias() {
  const { role } = useAuth();
  const { toggleSidebar } = useSidebar();
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
    setMaterias((prev) =>
      prev.map((x) =>
        x.id === m.id ? { ...x, status: x.status === 'Activa' ? 'Inactiva' : 'Activa' } : x,
      ),
    );
  };

  return (
    <article className="mat-screen">
      <header className="mat-topbar">
        <article className="mat-topbar-side">
          <button className="mat-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list mat-icon"></i>
          </button>
          <span className="mat-topbar-title">Materias</span>
        </article>
        <article className="mat-topbar-side">
          <i className="bi bi-bell mat-icon"></i>
          <i className="bi bi-person-circle mat-icon"></i>
        </article>
      </header>


      <main className="mat-content">
        <section className="mat-hero">
          <article className="mat-hero-top">
            <article>
              <h1 className="mat-hero-title">Portal de Coordinación Escolar</h1>
              <p className="mat-hero-subtitle">
                Apertura de grupos, matrícula de alumnos y docentes, y gestión del plan de estudios oficial.
              </p>
            </article>
          </article>
        </section>

        <section className="mat-scope">
          <span className="mat-scope-text">
            <strong>Ámbito Operativo:</strong> Asignaturas y grupos bajo su titularidad académica.
          </span>
        </section>

        <section className="mat-toolbar">
          <article className="mat-search-row">
            <i className="bi bi-search mat-search-icon"></i>
            <input
              className="mat-search-input"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar materia..."
              aria-label="Buscar materias"
            />
          </article>
          <button className="mat-btn mat-btn-primary" type="button" onClick={() => setModal({ tipo: 'nueva' })}>
            <i className="bi bi-plus-lg"></i> Nueva materia
          </button>
        </section>

        <section className="mat-card">
          {filtradas.length === 0 ? (
            <p className="mat-empty">
              {busqueda
                ? `No hay materias que coincidan con "${busqueda}".`
                : 'Aún no hay materias. Crea la primera con "Nueva materia".'}
            </p>
          ) : (
            <article className="mat-table-wrap">
              <table className="mat-table">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Plan de estudio</th>
                    <th scope="col">Unidades</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((m) => (
                    <tr key={m.id}>
                      <td className="mat-td-nombre">{m.nombre}</td>
                      <td>
                        {m.planEstudioNombre ? (
                          <span className="mat-plan">
                            <i className="bi bi-file-earmark-pdf"></i> {m.planEstudioNombre}
                          </span>
                        ) : (
                          <span className="mat-plan mat-plan-vacio">Sin cargar</span>
                        )}
                      </td>
                      <td className="mat-td-suave">
                        {plural(m.unidades.length, 'unidad', 'unidades')} · {plural(contarTemas(m), 'tema', 'temas')}
                      </td>
                      <td>
                        <span className={`mat-badge ${m.status === 'Activa' ? 'mat-badge-activa' : 'mat-badge-inactiva'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <article className="mat-actions">
                          <button
                              className="mat-link mat-link-editar"
                              type="button"
                              disabled={m.status === 'Inactiva'}
                              title={m.status === 'Inactiva' ? 'Reactiva la materia para poder editarla' : undefined}
                              onClick={() => setModal({ tipo: 'editar', materia: m })}
                            >
                              <i className="bi bi-pencil"></i> Editar
                          </button>
                          <button
                            className={`mat-link ${m.status === 'Activa' ? 'mat-link-desactivar' : 'mat-link-activar'}`}
                            type="button"
                            onClick={() => cambiarStatus(m)}
                          >
                            {m.status === 'Activa' ? 'Desactivar' : 'Activar'}
                          </button>
                        </article>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          )}
        </section>
      </main>

      {modal && (
        <ModalMateria
          key={modal.tipo === 'editar' ? modal.materia.id : 'nueva'}
          materia={modal.tipo === 'editar' ? modal.materia : null}
          onCerrar={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </article>
  );
}