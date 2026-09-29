import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import '../styles/QuizNuevo.css';

type TipoQuiz = 'unico' | 'acumulativo';

interface Concepto {
  id: string;
  nombre: string;
}
interface Tema {
  id: string;
  nombre: string;
  conceptos: Concepto[];
}
interface Unidad {
  id: string;
  nombre: string;
  temas: Tema[];
}
interface MateriaTemario {
  nombre: string;
  unidades: Unidad[];
}

interface Opcion {
  id: string;
  texto: string;
  esCorrecta: boolean;
}
interface Pregunta {
  id: string;
  unidadId: string;
  temaId: string;
  conceptoId: string;
  enunciado: string;
  opciones: Opcion[];
}

let contId = 0;
function newId(prefijo: string): string {
  contId += 1;
  return `${prefijo}-${Date.now()}-${contId}`;
}

function emptyOpcion(): Opcion {
  return { id: newId('op'), texto: '', esCorrecta: false };
}

function emptyPregunta(unidadId = '', temaId = ''): Pregunta {
  return {
    id: newId('preg'),
    unidadId,
    temaId,
    conceptoId: '',
    enunciado: '',
    opciones: [emptyOpcion(), emptyOpcion()],
  };
}

// Mock: temario de la materia de cada grupo (solo MAT3-A por ahora).
// TODO: sustituir por el catálogo real de materias cuando esté conectado.
const MATERIA_POR_GRUPO: Record<string, MateriaTemario> = {
  'MAT3-A': {
    nombre: 'Matemáticas III',
    unidades: [
      {
        id: 'u1',
        nombre: 'Unidad 1 — Funciones Trigonométricas',
        temas: [
          {
            id: 't1',
            nombre: 'Identidades Trigonométricas',
            conceptos: [
              { id: 'c1', nombre: 'Identidad fundamental' },
              { id: 'c2', nombre: 'Seno recíproco' },
              { id: 'c3', nombre: 'Coseno recíproco' },
            ],
          },
          {
            id: 't2',
            nombre: 'Funciones inversas',
            conceptos: [
              { id: 'c4', nombre: 'Arcoseno' },
              { id: 'c5', nombre: 'Arcocoseno' },
            ],
          },
        ],
      },
      {
        id: 'u2',
        nombre: 'Unidad 2 — Geometría Analítica',
        temas: [
          {
            id: 't3',
            nombre: 'La recta',
            conceptos: [{ id: 'c6', nombre: 'Pendiente' }],
          },
        ],
      },
    ],
  },
};

// Mock de un quiz existente, solo para la edición de MAT3-A / q4.
const MOCK_QUIZ_EDITAR: Record<string, unknown> = {
  q4: {
    titulo: 'Quiz 4: Identidades Trigonométricas',
    tipo: 'unico' as TipoQuiz,
    unidadUnicaId: 'u1',
    temaUnicoId: 't1',
    fechaApertura: '2026-09-14',
    horaApertura: '10:00',
    fechaCierre: '2026-09-14',
    horaCierre: '11:00',
    verRespuestasAntesCierre: false,
    preguntas: [
      {
        id: 'preg-mock-1',
        unidadId: 'u1',
        temaId: 't1',
        conceptoId: 'c2',
        enunciado: '¿Cuál de las siguientes identidades define correctamente el seno recíproco?',
        opciones: [
          { id: 'op-1', texto: 'csc(x) = 1 / sen(x)', esCorrecta: true },
          { id: 'op-2', texto: 'sec(x) = 1 / cos(x)', esCorrecta: false },
          { id: 'op-3', texto: 'cot(x) = 1 / tan(x)', esCorrecta: false },
          { id: 'op-4', texto: 'sen(x) ^ cos(x) = 1', esCorrecta: false },
        ],
      },
      {
        id: 'preg-mock-2',
        unidadId: 'u1',
        temaId: 't1',
        conceptoId: 'c1',
        enunciado: '¿Cuál es la identidad fundamental trigonométrica por excelencia?',
        opciones: [emptyOpcion(), emptyOpcion()],
      },
    ],
  },
};

function combinarFechaHora(fecha: string, hora: string): Date | null {
  if (!fecha || !hora) return null;
  const d = new Date(`${fecha}T${hora}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function QuizNuevo() {
  const { code, quizId } = useParams<{ code: string; quizId?: string }>();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const esEdicion = !!quizId;

  const materia = code ? MATERIA_POR_GRUPO[code] : undefined;
  const primeraUnidad = materia?.unidades[0];
  const primerTema = primeraUnidad?.temas[0];

  const mockEdicion = esEdicion && quizId ? MOCK_QUIZ_EDITAR[quizId] : undefined;

  const [titulo, setTitulo] = useState(
    (mockEdicion as { titulo?: string } | undefined)?.titulo ?? ''
  );
  const [tipo, setTipo] = useState<TipoQuiz>(
    (mockEdicion as { tipo?: TipoQuiz } | undefined)?.tipo ?? 'unico'
  );
  const [unidadUnicaId, setUnidadUnicaId] = useState(
    (mockEdicion as { unidadUnicaId?: string } | undefined)?.unidadUnicaId ?? primeraUnidad?.id ?? ''
  );
  const [temaUnicoId, setTemaUnicoId] = useState(
    (mockEdicion as { temaUnicoId?: string } | undefined)?.temaUnicoId ?? primerTema?.id ?? ''
  );
  const [fechaApertura, setFechaApertura] = useState(
    (mockEdicion as { fechaApertura?: string } | undefined)?.fechaApertura ?? ''
  );
  const [horaApertura, setHoraApertura] = useState(
    (mockEdicion as { horaApertura?: string } | undefined)?.horaApertura ?? ''
  );
  const [fechaCierre, setFechaCierre] = useState(
    (mockEdicion as { fechaCierre?: string } | undefined)?.fechaCierre ?? ''
  );
  const [horaCierre, setHoraCierre] = useState(
    (mockEdicion as { horaCierre?: string } | undefined)?.horaCierre ?? ''
  );
  const [verRespuestasAntesCierre, setVerRespuestasAntesCierre] = useState(
    (mockEdicion as { verRespuestasAntesCierre?: boolean } | undefined)?.verRespuestasAntesCierre ?? false
  );
  const [preguntas, setPreguntas] = useState<Pregunta[]>(
    (mockEdicion as { preguntas?: Pregunta[] } | undefined)?.preguntas ?? [
      emptyPregunta(primeraUnidad?.id ?? '', primerTema?.id ?? ''),
    ]
  );
  const [error, setError] = useState<string | null>(null);

  function unidadesDe() {
    return materia?.unidades ?? [];
  }
  function temasDe(unidadId: string) {
    return unidadesDe().find((u) => u.id === unidadId)?.temas ?? [];
  }
  function conceptosDe(unidadId: string, temaId: string) {
    return temasDe(unidadId).find((t) => t.id === temaId)?.conceptos ?? [];
  }

  function handleCambiarTipo(nuevoTipo: TipoQuiz) {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'unico') {
      setPreguntas((prev) =>
        prev.map((p) => ({ ...p, unidadId: unidadUnicaId, temaId: temaUnicoId, conceptoId: '' }))
      );
    }
  }

  function handleCambiarUnidadUnica(unidadId: string) {
    const nuevoTema = temasDe(unidadId)[0]?.id ?? '';
    setUnidadUnicaId(unidadId);
    setTemaUnicoId(nuevoTema);
    setPreguntas((prev) => prev.map((p) => ({ ...p, unidadId, temaId: nuevoTema, conceptoId: '' })));
  }

  function handleCambiarTemaUnico(temaId: string) {
    setTemaUnicoId(temaId);
    setPreguntas((prev) => prev.map((p) => ({ ...p, temaId, conceptoId: '' })));
  }

  function updatePregunta(id: string, cambios: Partial<Pregunta>) {
    setPreguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  }

  function handleCambiarUnidadPregunta(id: string, unidadId: string) {
    const nuevoTema = temasDe(unidadId)[0]?.id ?? '';
    updatePregunta(id, { unidadId, temaId: nuevoTema, conceptoId: '' });
  }

  function handleCambiarTemaPregunta(id: string, temaId: string) {
    updatePregunta(id, { temaId, conceptoId: '' });
  }

  function addQuestion() {
    setPreguntas((prev) => [
      ...prev,
      emptyPregunta(tipo === 'unico' ? unidadUnicaId : '', tipo === 'unico' ? temaUnicoId : ''),
    ]);
  }

  function deleteQuestion(id: string) {
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
  }

  function updateOption(preguntaId: string, opcionId: string, texto: string) {
    setPreguntas((prev) =>
      prev.map((p) =>
        p.id !== preguntaId
          ? p
          : { ...p, opciones: p.opciones.map((o) => (o.id === opcionId ? { ...o, texto } : o)) }
      )
    );
  }

  function addOption(preguntaId: string) {
    setPreguntas((prev) =>
      prev.map((p) => (p.id === preguntaId ? { ...p, opciones: [...p.opciones, emptyOpcion()] } : p))
    );
  }

  function deleteOption(preguntaId: string, opcionId: string) {
    setPreguntas((prev) =>
      prev.map((p) => {
        if (p.id !== preguntaId || p.opciones.length <= 2) return p;
        return { ...p, opciones: p.opciones.filter((o) => o.id !== opcionId) };
      })
    );
  }

  function markCorrect(preguntaId: string, opcionId: string) {
    setPreguntas((prev) =>
      prev.map((p) =>
        p.id !== preguntaId
          ? p
          : { ...p, opciones: p.opciones.map((o) => ({ ...o, esCorrecta: o.id === opcionId })) }
      )
    );
  }

  function validate(): string | null {
    if (!titulo.trim()) return 'El quiz necesita un título.';

    if (tipo === 'unico' && (!unidadUnicaId || !temaUnicoId)) {
      return 'Selecciona la unidad y el tema del quiz.';
    }

    const apertura = combinarFechaHora(fechaApertura, horaApertura);
    const cierre = combinarFechaHora(fechaCierre, horaCierre);
    if (!apertura || !cierre) return 'Define la fecha y hora de apertura y de cierre.';
    if (cierre <= apertura) return 'La fecha de cierre debe ser posterior a la de apertura.';

    if (preguntas.length === 0) return 'Agrega al menos una pregunta.';

    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      if (tipo === 'acumulativo' && (!p.unidadId || !p.temaId)) {
        return `Selecciona unidad y tema en la pregunta ${i + 1}.`;
      }
      if (!p.conceptoId) return `Selecciona el concepto de la pregunta ${i + 1}.`;
      if (!p.enunciado.trim()) return `La pregunta ${i + 1} no tiene enunciado.`;
      if (p.opciones.some((o) => !o.texto.trim())) {
        return `Todas las opciones de la pregunta ${i + 1} deben tener texto.`;
      }
      if (!p.opciones.some((o) => o.esCorrecta)) {
        return `Marca la respuesta correcta de la pregunta ${i + 1}.`;
      }
    }
    return null;
  }

  function handleSubmit() {
    const mensaje = validate();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);
    console.log(esEdicion ? 'Quiz editado (mock):' : 'Quiz creado (mock):', {
      code,
      quizId,
      titulo,
      tipo,
      unidadUnicaId: tipo === 'unico' ? unidadUnicaId : undefined,
      temaUnicoId: tipo === 'unico' ? temaUnicoId : undefined,
      fechaApertura,
      horaApertura,
      fechaCierre,
      horaCierre,
      verRespuestasAntesCierre,
      preguntas,
    });
    navigate(`/grupos/${code}`);
  }

  if (!materia) {
    return (
      <article className="qn-screen">
        <header className="qn-topbar">
          <button className="qn-icon-btn" onClick={toggleSidebar} aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list"></i>
          </button>
          <span className="qn-topbar-title">Docente</span>
        </header>
        <article className="qn-body">
          <p className="qn-empty">
            No se encontró el temario de la materia para el grupo {code}. (Mock disponible solo para MAT3-A.)
          </p>
        </article>
      </article>
    );
  }

  return (
    <article className="qn-screen">
      <header className="qn-topbar">
        <button className="qn-icon-btn" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
          <i className="bi bi-list"></i>
        </button>
        <span className="qn-topbar-title">Docente</span>
      </header>


      <article className="qn-body">
        <header className="qn-header">
          <h1 className="qn-title">{esEdicion ? 'Editar quiz' : 'Crear nuevo quiz'}</h1>
          <p className="qn-subtitle">
            {materia.nombre} — {code}
          </p>
        </header>

        <section className="qn-section">
          <label className="qn-field">
            <span className="qn-field-label">Título del quiz</span>
            <input
              className="qn-input"
              type="text"
              placeholder="Ej. Quiz 5: Identidades Recíprocas"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>

          <article className="qn-field">
            <span className="qn-field-label">Tipo de quiz</span>
            <article className="qn-tipo-toggle">
              <button
                type="button"
                className={`qn-tipo-btn ${tipo === 'unico' ? 'active' : ''}`}
                onClick={() => handleCambiarTipo('unico')}
              >
                Un solo tema
              </button>
              <button
                type="button"
                className={`qn-tipo-btn ${tipo === 'acumulativo' ? 'active' : ''}`}
                onClick={() => handleCambiarTipo('acumulativo')}
              >
                Acumulativo / diagnóstico
              </button>
            </article>
          </article>

          {tipo === 'unico' && (
            <article className="qn-field-row">
              <label className="qn-field">
                <span className="qn-field-label">Unidad</span>
                <select
                  className="qn-input"
                  value={unidadUnicaId}
                  onChange={(e) => handleCambiarUnidadUnica(e.target.value)}
                >
                  {unidadesDe().map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="qn-field">
                <span className="qn-field-label">Tema</span>
                <select
                  className="qn-input"
                  value={temaUnicoId}
                  onChange={(e) => handleCambiarTemaUnico(e.target.value)}
                >
                  {temasDe(unidadUnicaId).map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </label>
            </article>
          )}

          <article className="qn-field-row">
            <label className="qn-field">
              <span className="qn-field-label">Fecha de apertura</span>
              <input
                className="qn-input"
                type="date"
                value={fechaApertura}
                onChange={(e) => setFechaApertura(e.target.value)}
              />
            </label>
            <label className="qn-field">
              <span className="qn-field-label">Hora de apertura</span>
              <input
                className="qn-input"
                type="time"
                value={horaApertura}
                onChange={(e) => setHoraApertura(e.target.value)}
              />
            </label>
          </article>

          <article className="qn-field-row">
            <label className="qn-field">
              <span className="qn-field-label">Fecha de cierre</span>
              <input
                className="qn-input"
                type="date"
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
              />
            </label>
            <label className="qn-field">
              <span className="qn-field-label">Hora de cierre</span>
              <input
                className="qn-input"
                type="time"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </label>
          </article>

          <article className="qn-toggle-row">
            <span className="qn-field-label">El alumno puede ver sus respuestas antes del cierre</span>
            <button
              type="button"
              role="switch"
              aria-checked={verRespuestasAntesCierre}
              className={`qn-switch ${verRespuestasAntesCierre ? 'on' : ''}`}
              onClick={() => setVerRespuestasAntesCierre((v) => !v)}
            >
              <span className="qn-switch-knob"></span>
            </button>
          </article>
        </section>

        <section className="qn-section">
          <h2 className="qn-preguntas-title">Preguntas ({preguntas.length})</h2>

          {preguntas.map((pregunta, index) => {
            const unidadPregunta = tipo === 'unico' ? unidadUnicaId : pregunta.unidadId;
            const temaPregunta = tipo === 'unico' ? temaUnicoId : pregunta.temaId;

            return (
              <article key={pregunta.id} className="qn-pregunta">
                <article className="qn-pregunta-top">
                  <span className="qn-pregunta-label">Pregunta {index + 1}</span>
                  <button
                    type="button"
                    className="qn-icon-danger"
                    onClick={() => deleteQuestion(pregunta.id)}
                    aria-label={`Eliminar pregunta ${index + 1}`}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </article>

                {tipo === 'acumulativo' && (
                  <article className="qn-field-row">
                    <label className="qn-field">
                      <span className="qn-field-label">Unidad</span>
                      <select
                        className="qn-input"
                        value={unidadPregunta}
                        onChange={(e) => handleCambiarUnidadPregunta(pregunta.id, e.target.value)}
                      >
                        <option value="">Selecciona una unidad</option>
                        {unidadesDe().map((u) => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </label>
                    <label className="qn-field">
                      <span className="qn-field-label">Tema</span>
                      <select
                        className="qn-input"
                        value={temaPregunta}
                        onChange={(e) => handleCambiarTemaPregunta(pregunta.id, e.target.value)}
                        disabled={!unidadPregunta}
                      >
                        <option value="">
                          {unidadPregunta ? 'Selecciona un tema' : 'Primero elige una unidad'}
                        </option>
                        {temasDe(unidadPregunta).map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                )}

                <label className="qn-field">
                  <span className="qn-field-label">Enunciado</span>
                  <input
                    className="qn-input"
                    type="text"
                    placeholder="Escribe la pregunta..."
                    value={pregunta.enunciado}
                    onChange={(e) => updatePregunta(pregunta.id, { enunciado: e.target.value })}
                  />
                </label>

                <label className="qn-field">
                  <span className="qn-field-label">Concepto relacionado</span>
                  <select
                    className="qn-input"
                    value={pregunta.conceptoId}
                    onChange={(e) => updatePregunta(pregunta.id, { conceptoId: e.target.value })}
                    disabled={!temaPregunta}
                  >
                    <option value="">
                      {temaPregunta ? 'Selecciona un concepto' : 'Elige unidad y tema primero'}
                    </option>
                    {conceptosDe(unidadPregunta, temaPregunta).map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </label>

                <article className="qn-field">
                  <span className="qn-field-label">
                    Opciones de respuesta — cada pregunta tiene una sola respuesta válida
                  </span>
                  {pregunta.opciones.map((opcion, opIndex) => (
                    <article key={opcion.id} className="qn-opcion-row">
                      <input
                        className="qn-input qn-opcion-input"
                        type="text"
                        placeholder={`Texto de la opción...`}
                        value={opcion.texto}
                        onChange={(e) => updateOption(pregunta.id, opcion.id, e.target.value)}
                      />
                      <label className="qn-correcta-label">
                        <input
                          type="radio"
                          name={`correcta-${pregunta.id}`}
                          checked={opcion.esCorrecta}
                          onChange={() => markCorrect(pregunta.id, opcion.id)}
                        />
                        Correcta
                      </label>
                      {pregunta.opciones.length > 2 && (
                        <button
                          type="button"
                          className="qn-icon-danger"
                          onClick={() => deleteOption(pregunta.id, opcion.id)}
                          aria-label={`Eliminar opción ${opIndex + 1}`}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </article>
                  ))}
                  <button type="button" className="qn-add-link" onClick={() => addOption(pregunta.id)}>
                    + Agregar opción
                  </button>
                </article>
              </article>
            );
          })}

          <button type="button" className="qn-add-button" onClick={addQuestion}>
            <i className="bi bi-plus-lg"></i> Agregar pregunta
          </button>
        </section>

        {error && <p role="alert" className="qn-error">{error}</p>}

        <footer className="qn-footer">
          <button type="button" className="qn-btn-secondary" onClick={() => navigate(`/grupos/${code}`)}>
            Cancelar
          </button>
          <button type="button" className="qn-btn-primary" onClick={handleSubmit}>
            {esEdicion ? 'Guardar Cambios' : 'Crear Quiz'}
          </button>
        </footer>
      </article>
    </article>
  );
}