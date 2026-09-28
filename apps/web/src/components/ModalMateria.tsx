import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import type { Materia, Tema, Unidad } from '../types.ts';

const MAX_PDF_MB = 10;
const nuevoId = () => crypto.randomUUID();

export interface DatosMateria {
  nombre: string;
  unidades: Unidad[];
  planArchivo: File | null;
}

interface Props {
  materia?: Materia | null;
  onCerrar: () => void;
  onGuardar: (datos: DatosMateria) => void;
}

export default function ModalMateria ({ materia, onCerrar, onGuardar }: Props) {
  const esEdicion = !!materia;

  const [nombre, setNombre] = useState(materia?.nombre ?? '');
  const [unidades, setUnidades] = useState<Unidad[]>(() =>
    materia ? structuredClone(materia.unidades) : [],
  );
  const [planArchivo, setPlanArchivo] = useState<File | null>(null);
  const [reemplazandoPlan, setReemplazandoPlan] = useState(false);
  const [error, setError] = useState('');


  const handleArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    if (!archivo) {
      setPlanArchivo(null);
      return;
    }
    const esPdf = archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
    if (!esPdf) {
      setError('El plan de estudio debe ser un archivo PDF.');
      e.target.value = '';
      setPlanArchivo(null);
      return;
    }
    if (archivo.size > MAX_PDF_MB * 1024 * 1024) {
      setError(`El PDF no puede pesar más de ${MAX_PDF_MB} MB.`);
      e.target.value = '';
      setPlanArchivo(null);
      return;
    }
    setError('');
    setPlanArchivo(archivo);
  };

  const cancelarReemplazo = () => {
    setReemplazandoPlan(false);
    setPlanArchivo(null);
    setError('');
  };

  const mapTema = (uId: string, tId: string, fn: (t: Tema) => Tema) =>
    setUnidades((prev) =>
      prev.map((u) =>
        u.id !== uId ? u : { ...u, temas: u.temas.map((t) => (t.id !== tId ? t : fn(t))) },
      ),
    );

  const agregarUnidad = () =>
    setUnidades((prev) => [...prev, { id: nuevoId(), nombre: '', temas: [] }]);

  const quitarUnidad = (uId: string) => setUnidades((prev) => prev.filter((u) => u.id !== uId));

  const renombrarUnidad = (uId: string, valor: string) =>
    setUnidades((prev) => prev.map((u) => (u.id === uId ? { ...u, nombre: valor } : u)));

  const agregarTema = (uId: string) =>
    setUnidades((prev) =>
      prev.map((u) =>
        u.id === uId ? { ...u, temas: [...u.temas, { id: nuevoId(), nombre: '', conceptos: [] }] } : u,
      ),
    );

  const quitarTema = (uId: string, tId: string) =>
    setUnidades((prev) =>
      prev.map((u) => (u.id === uId ? { ...u, temas: u.temas.filter((t) => t.id !== tId) } : u)),
    );

  const renombrarTema = (uId: string, tId: string, valor: string) =>
    mapTema(uId, tId, (t) => ({ ...t, nombre: valor }));

  const agregarConcepto = (uId: string, tId: string) =>
    mapTema(uId, tId, (t) => ({ ...t, conceptos: [...t.conceptos, { id: nuevoId(), nombre: '' }] }));

  const quitarConcepto = (uId: string, tId: string, cId: string) =>
    mapTema(uId, tId, (t) => ({ ...t, conceptos: t.conceptos.filter((c) => c.id !== cId) }));

  const renombrarConcepto = (uId: string, tId: string, cId: string, valor: string) =>
    mapTema(uId, tId, (t) => ({
      ...t,
      conceptos: t.conceptos.map((c) => (c.id === cId ? { ...c, nombre: valor } : c)),
    }));

  const validate = (): string => {
    if (!nombre.trim()) return 'El nombre de la materia es obligatorio.';
    if (!esEdicion && !planArchivo) return 'Carga el plan de estudio en PDF.';
    if (reemplazandoPlan && !planArchivo) return 'Selecciona el PDF nuevo o cancela el reemplazo.';
    for (const u of unidades) {
      if (!u.nombre.trim()) return 'Todas las unidades deben tener nombre.';
      for (const t of u.temas) {
        if (!t.nombre.trim()) return `Hay un tema sin nombre en la unidad "${u.nombre}".`;
        for (const c of t.conceptos) {
          if (!c.nombre.trim()) return `Hay un concepto sin nombre en el tema "${t.nombre}".`;
        }
      }
    }
    return '';
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
      nombre: nombre.trim(),
      unidades: unidades.map((u) => ({
        ...u,
        nombre: u.nombre.trim(),
        temas: u.temas.map((t) => ({
          ...t,
          nombre: t.nombre.trim(),
          conceptos: t.conceptos.map((c) => ({ ...c, nombre: c.nombre.trim() })),
        })),
      })),
      planArchivo,
    });
  };

  const mostrarInputArchivo = !esEdicion || reemplazandoPlan || !materia?.planEstudioNombre;

  return (
    <article>
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-materia-titulo"
      >
        <header>
          <h2 id="modal-materia-titulo">{esEdicion ? 'Editar materia' : 'Nueva materia'}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="materia-nombre">Nombre de la materia</label>
          <input
            id="materia-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Matemáticas 3"
            autoFocus
          />

          <fieldset>
            <legend>Plan de estudio (PDF)</legend>

            {esEdicion && materia?.planEstudioNombre && !reemplazandoPlan && (
              <p>
                <i className="bi bi-file-earmark-pdf" aria-hidden="true" /> {materia.planEstudioNombre}{' '}
                <button type="button" onClick={() => setReemplazandoPlan(true)}>
                  Reemplazar plan
                </button>
              </p>
            )}

            {mostrarInputArchivo && (
              <>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleArchivo}
                  aria-label="Archivo PDF del plan de estudio"
                />
                {planArchivo && <p>Seleccionado: {planArchivo.name}</p>}
                {esEdicion && reemplazandoPlan && (
                  <button type="button" onClick={cancelarReemplazo}>
                    Cancelar reemplazo
                  </button>
                )}
                <small>Máximo {MAX_PDF_MB} MB.</small>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>Unidades, temas y conceptos</legend>

            {unidades.length === 0 && (
              <p>Aún no hay unidades. Agrégalas aquí o deja que el análisis del plan las detecte.</p>
            )}

            {unidades.map((u, ui) => (
              <article key={u.id}>
                <article>
                  <input
                    type="text"
                    value={u.nombre}
                    onChange={(e) => renombrarUnidad(u.id, e.target.value)}
                    placeholder={`Unidad ${ui + 1}`}
                    aria-label={`Nombre de la unidad ${ui + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => quitarUnidad(u.id)}
                    aria-label={`Eliminar unidad ${ui + 1}`}
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                  </button>
                </article>

                {u.temas.map((t, ti) => (
                  <article key={t.id}>
                    <article>
                      <input
                        type="text"
                        value={t.nombre}
                        onChange={(e) => renombrarTema(u.id, t.id, e.target.value)}
                        placeholder={`Tema ${ti + 1}`}
                        aria-label={`Nombre del tema ${ti + 1} de la unidad ${ui + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => quitarTema(u.id, t.id)}
                        aria-label={`Eliminar tema ${ti + 1}`}
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    </article>

                    {t.conceptos.map((c, ci) => (
                      <article key={c.id}>
                        <input
                          type="text"
                          value={c.nombre}
                          onChange={(e) => renombrarConcepto(u.id, t.id, c.id, e.target.value)}
                          placeholder={`Concepto ${ci + 1}`}
                          aria-label={`Nombre del concepto ${ci + 1} del tema ${ti + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => quitarConcepto(u.id, t.id, c.id)}
                          aria-label={`Eliminar concepto ${ci + 1}`}
                        >
                          <i className="bi bi-x" aria-hidden="true" />
                        </button>
                      </article>
                    ))}

                    <button type="button" onClick={() => agregarConcepto(u.id, t.id)}>
                      + Concepto
                    </button>
                  </article>
                ))}

                <button type="button" onClick={() => agregarTema(u.id)}>
                  + Tema
                </button>
              </article>
            ))}

            <button type="button" onClick={agregarUnidad}>
              + Unidad
            </button>
          </fieldset>

          {error && <p role="alert">{error}</p>}

          <footer>
            <button type="button" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit">{esEdicion ? 'Guardar cambios' : 'Crear materia'}</button>
          </footer>
        </form>
      </article>
    </article>
  );
}