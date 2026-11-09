import { useState, type SubmitEvent } from 'react';
import type { Materia } from '../../types/types.ts';
import '../../styles/ModalMateria.css';

export interface ConceptoForm {
  id: string;
  nombre: string;
}

export interface TemaForm {
  id: string;
  nombre: string;
  conceptos: ConceptoForm[];
}

export interface UnidadForm {
  id: string;
  nombre: string;
  temas: TemaForm[];
}

export interface DatosMateria {
  id: string;
  nombre: string;
  prefijo: string;
  planEstudioId: string;
  unidades: UnidadForm[];
}

interface Props {
  materia?: Materia | null;
  onCerrar: () => void;
  onGuardar: (datos: DatosMateria) => void;
}

function derivarPrefijo(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase();

  return limpio || 'MATE';
}

function extraerNumeroDesdePrefijo(prefijo?: string): number {
  const match = prefijo?.match(/(\d)$/);
  const numero = match ? Number(match[1]) : 1;
  return Number.isFinite(numero) && numero >= 1 && numero <= 9 ? numero : 1;
}

function crearConceptoVacio(): ConceptoForm {
  return { id: crypto.randomUUID(), nombre: '' };
}

function crearTemaVacio(): TemaForm {
  return { id: crypto.randomUUID(), nombre: '', conceptos: [crearConceptoVacio()] };
}

function crearUnidadVacia(): UnidadForm {
  return { id: crypto.randomUUID(), nombre: '', temas: [crearTemaVacio()] };
}


function crearDatosDesdeMateria(materia: Materia | null | undefined, esEdicion: boolean): UnidadForm[] {
  if (!materia?.unidades?.length) {
    return [];
  }

  return materia.unidades.map((unidad) => ({
    id: unidad.id ?? crypto.randomUUID(),
    nombre: unidad.nombre ?? '',
    temas: (unidad.temas ?? []).map((tema) => ({
      id: tema.id ?? crypto.randomUUID(),
      nombre: tema.nombre ?? '',
      conceptos: (tema.conceptos ?? []).map((concepto) => ({
        id: concepto.id ?? crypto.randomUUID(),
        nombre: concepto.nombre ?? '',
      })),
    })),
  }));
}

export default function ModalMateria({ materia, onCerrar, onGuardar }: Props) {
  const esEdicion = !!materia;

  const [id] = useState(materia?.id ?? crypto.randomUUID());
  const [nombre, setNombre] = useState(materia?.nombre ?? '');
  const [numero, setNumero] = useState<number>(() => extraerNumeroDesdePrefijo(materia?.prefijo));
  const [unidades, setUnidades] = useState<UnidadForm[]>(() => crearDatosDesdeMateria(materia, esEdicion));
  const [error, setError] = useState('');

  const [prefijo, setPrefijo] = useState(materia?.prefijo?.replace(/\d$/, '') || derivarPrefijo(materia?.nombre ?? ''));
  const [prefijoModificado, setPrefijoModificado] = useState(false);
  const prefijoFinal = `${prefijo}${numero}`;
  const [archivo, setArchivo] = useState<File | null>(null);

  const validate = (): string => {
    if (!nombre.trim()) return 'El nombre de la materia es obligatorio.';
    if (!prefijo.trim()) return 'El prefijo de la materia es obligatorio.';
    if (esEdicion) return '';

    const unidadesValidas = unidades.filter((unidad) => unidad.nombre.trim() && unidad.temas.some((tema) => tema.nombre.trim() && tema.conceptos.some((concepto) => concepto.nombre.trim())));
    if (!unidadesValidas.length) return 'Agrega al menos una unidad con temas y conceptos.';
    return '';
  };

  const actualizarUnidad = (unidadId: string, cambios: Partial<UnidadForm>) => {
    setUnidades((prev) => prev.map((unidad) => (unidad.id === unidadId ? { ...unidad, ...cambios } : unidad)));
  };

  const actualizarTema = (unidadId: string, temaId: string, cambios: Partial<TemaForm>) => {
    setUnidades((prev) => prev.map((unidad) => {
      if (unidad.id !== unidadId) return unidad;
      return {
        ...unidad,
        temas: unidad.temas.map((tema) => (tema.id === temaId ? { ...tema, ...cambios } : tema)),
      };
    }));
  };

  const actualizarConcepto = (unidadId: string, temaId: string, conceptoId: string, nombreConcepto: string) => {
    setUnidades((prev) => prev.map((unidad) => {
      if (unidad.id !== unidadId) return unidad;
      return {
        ...unidad,
        temas: unidad.temas.map((tema) => {
          if (tema.id !== temaId) return tema;
          return {
            ...tema,
            conceptos: tema.conceptos.map((concepto) =>
              concepto.id === conceptoId ? { ...concepto, nombre: nombreConcepto } : concepto,
            ),
          };
        }),
      };
    }));
  };

  const agregarUnidad = () => {
    setUnidades((prev) => [...prev, crearUnidadVacia()]);
  };

  const agregarTema = (unidadId: string) => {
    setUnidades((prev) => prev.map((unidad) =>
      unidad.id === unidadId ? { ...unidad, temas: [...unidad.temas, crearTemaVacio()] } : unidad,
    ));
  };

  const agregarConcepto = (unidadId: string, temaId: string) => {
    setUnidades((prev) => prev.map((unidad) => {
      if (unidad.id !== unidadId) return unidad;
      return {
        ...unidad,
        temas: unidad.temas.map((tema) =>
          tema.id === temaId ? { ...tema, conceptos: [...tema.conceptos, crearConceptoVacio()] } : tema,
        ),
      };
    }));
  };

  const eliminarUnidad = (unidadId: string) => {
    setUnidades((prev) => prev.filter((unidad) => unidad.id !== unidadId));
  };

  const eliminarTema = (unidadId: string, temaId: string) => {
    setUnidades((prev) => prev.map((unidad) => {
      if (unidad.id !== unidadId) return unidad;
      return {
        ...unidad,
        temas: unidad.temas.filter((tema) => tema.id !== temaId),
      };
    }));
  };

  const eliminarConcepto = (unidadId: string, temaId: string, conceptoId: string) => {
    setUnidades((prev) => prev.map((unidad) => {
      if (unidad.id !== unidadId) return unidad;
      return {
        ...unidad,
        temas: unidad.temas.map((tema) => {
          if (tema.id !== temaId) return tema;
          return {
            ...tema,
            conceptos: tema.conceptos.filter((concepto) => concepto.id !== conceptoId),
          };
        }),
      };
    }));
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    onGuardar({
      id: id.trim(),
      nombre: nombre.trim(),
      prefijo:prefijoFinal,
      planEstudioId: '',
      unidades: unidades
        .filter((unidad) => unidad.nombre.trim())
        .map((unidad) => ({
          ...unidad,
          nombre: unidad.nombre.trim(),
          temas: (unidad.temas ?? [])
            .filter((tema) => tema.nombre.trim())
            .map((tema) => ({
              ...tema,
              nombre: tema.nombre.trim(),
              conceptos: (tema.conceptos ?? [])
                .filter((concepto) => concepto.nombre.trim())
                .map((concepto) => ({
                  ...concepto,
                  nombre: concepto.nombre.trim(),
                })),
            }))
            .filter((tema) => tema.conceptos.length > 0),
        }))
        .filter((unidad) => unidad.temas.length > 0),
    });
  };

  return (
    <article className="mm-overlay">
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-materia-titulo"
        className="mm-modal"
      >
        <header className="mm-header">
          <article>
            <h2 id="modal-materia-titulo" className="mm-header-title">
              {esEdicion ? 'Editar materia' : 'Nueva materia'}
            </h2>
            <p className="mm-header-subtitle">Preparatoria Chapala Gutiérrez</p>
          </article>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mm-form">
          <article className="mm-field">
            <label htmlFor="materia-nombre" className="mm-label">Nombre de la materia</label>
            <input
              id="materia-nombre"
              className="mm-input"
              type="text"
              value={nombre}
              onChange={(e) => {
                const nuevoNombre = e.target.value;
                setNombre(nuevoNombre);
                if (!prefijoModificado){
                  setPrefijo(nuevoNombre.trim() ? derivarPrefijo(nuevoNombre) : '');
                }
              }}

            />
          </article>

          <article className="mm-field">
            <label className="mm-label">Prefijo</label>
            <article style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="mm-input"
                type="text"
                value={prefijo}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^a-zA-Z]/g,'').slice(0,4).toUpperCase();
                  if(valor === ''){
                    setPrefijoModificado(false);
                    setPrefijo('');
                    return;
                  }
                  setPrefijo(valor);
                  setPrefijoModificado(valor !== derivarPrefijo(nombre));
                }}
                placeholder='Ej.MATE'
                aria-label="Prefijo derivado de la materia"
              />
              <input
                className="mm-input"
                type="number"
                min={1}
                max={9}
                step={1}
                value={numero}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (valor === '') return;
                  const next = Number(valor);
                  if (!Number.isInteger(next) || next < 1 || next > 9)  return;
                  setNumero(next);
                }}
                aria-label="Número del prefijo"
                style={{ maxWidth: '90px' }}
              />
            </article>
          </article>

          <fieldset className="mm-fieldset">
                <article className="mm-field">
                  <label className="mm-label">Plan de estudio</label>

                  <label htmlFor="materia-archivo" className="mm-add-btn">
                    <i className="bi bi-paperclip"></i>
                    {archivo ? 'Cambiar archivo' : 'Agregar archivo'}
                  </label>

                  <input
                    id="materia-archivo"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    hidden
                    onChange={(e) => {
                      const seleccionado = e.target.files?.[0] ?? null;
                      setArchivo(seleccionado);
                    }}
                  />

                  {archivo && (
                    <div className="mm-hint-box">
                      <span>{archivo.name}</span>

                      <button
                        type="button"
                        className="mm-icon-btn"
                        onClick={() => setArchivo(null)}
                        aria-label="Eliminar archivo"
                        title="Eliminar archivo"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  )}
                </article>

            <legend className="mm-legend">Unidades, temas y conceptos</legend>
            <p className="mm-hint-box">Cada materia puede incluir varias unidades con temas y conceptos para crear quizzes con contenido real.</p>

            {unidades.map((unidad) => (
              <article key={unidad.id} className="mm-unidad">
                <div className="mm-unidad-row">
                  <input
                    className="mm-input"
                    type="text"
                    value={unidad.nombre}
                    onChange={(e) => actualizarUnidad(unidad.id, { nombre: e.target.value })}
                    placeholder="Nombre de la unidad"
                  />
                  <button type="button" className="mm-icon-btn" onClick={() => eliminarUnidad(unidad.id)} aria-label="Eliminar unidad" title="Eliminar unidad">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>

                {unidad.temas.map((tema) => (
                  <article key={tema.id} className="mm-tema">
                    <div className="mm-tema-row">
                      <input
                        className="mm-input"
                        type="text"
                        value={tema.nombre}
                        onChange={(e) => actualizarTema(unidad.id, tema.id, { nombre: e.target.value })}
                        placeholder="Nombre del tema"
                      />
                      <button type="button" className="mm-icon-btn" onClick={() => eliminarTema(unidad.id, tema.id)} aria-label="Eliminar tema" title="Eliminar tema">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>

                    {tema.conceptos.map((concepto) => (
                      <div key={concepto.id} className="mm-concepto-row">
                        <input
                          className="mm-input"
                          type="text"
                          value={concepto.nombre}
                          onChange={(e) => actualizarConcepto(unidad.id, tema.id, concepto.id, e.target.value)}
                          placeholder="Nombre del concepto"
                        />
                        <button type="button" className="mm-icon-btn" onClick={() => eliminarConcepto(unidad.id, tema.id, concepto.id)} aria-label="Eliminar concepto" title="Eliminar concepto">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}

                    <button type="button" className="mm-add-btn" onClick={() => agregarConcepto(unidad.id, tema.id)}>
                      <i className="bi bi-plus-lg"></i> Añadir concepto
                    </button>
                  </article>
                ))}

                <button type="button" className="mm-add-btn" onClick={() => agregarTema(unidad.id)}>
                  <i className="bi bi-plus-lg"></i> Añadir tema
                </button>
              </article>
            ))}

            <button type="button" className="mm-add-btn" onClick={agregarUnidad}>
              <i className="bi bi-plus-lg"></i> Añadir unidad
            </button>
          </fieldset>

          {error && <p role="alert" className="mm-error">{error}</p>}

          <footer className="mm-footer">
            <button type="button" onClick={onCerrar} className="mat-btn">
              Cancelar
            </button>
            <button type="submit" className="mat-btn mat-btn-primary">
              {esEdicion ? 'Guardar cambios' : 'Crear materia'}
            </button>
          </footer>
        </form>
      </article>
    </article>
  );
}