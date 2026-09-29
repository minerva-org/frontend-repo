import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import { apiClient } from '../services/ApiClient';
import '../styles/QuizNuevo.css';

type TipoQuiz = 'unico' | 'acumulativo';

interface UnidadCatalogo {
  id: string;
  nombre: string;
  idMateria: string;
}

interface TemaCatalogo {
  id: string;
  nombre: string;
  unidadId: string;
}

interface ConceptoCatalogo {
  id: string;
  nombre: string;
  temaId: string;
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

interface QuizBackend {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFinalizacion: string;
  grupoId: string;
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

  const [unidades, setUnidades] = useState<UnidadCatalogo[]>([]);
  const [temas, setTemas] = useState<TemaCatalogo[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoCatalogo[]>([]);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoQuiz>('unico');
  const [unidadUnicaId, setUnidadUnicaId] = useState('');
  const [temaUnicoId, setTemaUnicoId] = useState('');
  const [fechaApertura, setFechaApertura] = useState('');
  const [horaApertura, setHoraApertura] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [horaCierre, setHoraCierre] = useState('');
  const [verRespuestasAntesCierre, setVerRespuestasAntesCierre] = useState(false);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const temasDeUnidad = useMemo(
    () => (unidadId: string) => temas.filter((tema) => tema.unidadId === unidadId),
    [temas],
  );

  const conceptosDeTema = useMemo(
    () => (temaId: string) => conceptos.filter((concepto) => concepto.temaId === temaId),
    [conceptos],
  );

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        const [unidadesResponse, temasResponse, conceptosResponse] = await Promise.all([
          apiClient.get<UnidadCatalogo[]>('/api/unidades'),
          apiClient.get<TemaCatalogo[]>('/api/temas'),
          apiClient.get<ConceptoCatalogo[]>('/api/conceptos'),
        ]);

        const unidadesData = unidadesResponse.data ?? [];
        const temasData = temasResponse.data ?? [];
        const conceptosData = conceptosResponse.data ?? [];

        setUnidades(unidadesData);
        setTemas(temasData);
        setConceptos(conceptosData);

        const firstUnidad = unidadesData[0];
        const firstTema = firstUnidad ? temasData.find((tema) => tema.unidadId === firstUnidad.id) : undefined;

        setUnidadUnicaId((current) => current || (firstUnidad?.id ?? ''));
        setTemaUnicoId((current) => current || (firstTema?.id ?? ''));

        if (!esEdicion) {
          setPreguntas([
            emptyPregunta(firstUnidad?.id ?? '', firstTema?.id ?? ''),
          ]);
        }
      } catch {
        setError('No se pudo cargar el catálogo de unidades, temas y conceptos del backend.');
      } finally {
        setLoading(false);
      }
    }

    void cargarCatalogo();
  }, [esEdicion]);

  useEffect(() => {
    if (!esEdicion || !quizId) return;

    async function cargarQuizExistente() {
      try {
        setLoading(true);
        const [quizResponse, preguntasResponse] = await Promise.all([
          apiClient.get<QuizBackend>(`/api/quizzes/${quizId}`),
          apiClient.get<{ id: string; descripcion: string; conceptoId: string }[]>(`/api/quizzes/${quizId}/preguntas`),
        ]);

        const quiz = quizResponse.data;
        const questionList = preguntasResponse.data ?? [];

        const preguntaMap = await Promise.all(
          questionList.map(async (pregunta) => {
            const opcionesResponse = await apiClient.get<{ id: string; descripcion: string; esCorrecta: boolean }[]>(`/api/opciones?preguntaId=${pregunta.id}`);
            const opciones = (opcionesResponse.data ?? []).map((opcion) => ({
              id: opcion.id,
              texto: opcion.descripcion,
              esCorrecta: Boolean(opcion.esCorrecta),
            }));

            const concepto = conceptos.find((item) => item.id === pregunta.conceptoId);
            const tema = concepto ? temas.find((item) => item.id === concepto.temaId) : undefined;
            const unidad = tema ? unidades.find((item) => item.id === tema.unidadId) : undefined;

            return {
              id: pregunta.id,
              unidadId: unidad?.id ?? '',
              temaId: tema?.id ?? '',
              conceptoId: pregunta.conceptoId,
              enunciado: pregunta.descripcion,
              opciones: opciones.length > 0 ? opciones : [emptyOpcion(), emptyOpcion()],
            } satisfies Pregunta;
          }),
        );

        const fechaInicio = quiz.fechaInicio ? new Date(quiz.fechaInicio) : null;
        const fechaFinalizacion = quiz.fechaFinalizacion ? new Date(quiz.fechaFinalizacion) : null;

        setTitulo(quiz.nombre ?? '');
        setTipo(questionList.length > 1 ? 'acumulativo' : 'unico');
        setFechaApertura(fechaInicio ? fechaInicio.toISOString().slice(0, 10) : '');
        setHoraApertura(fechaInicio ? fechaInicio.toISOString().slice(11, 16) : '');
        setFechaCierre(fechaFinalizacion ? fechaFinalizacion.toISOString().slice(0, 10) : '');
        setHoraCierre(fechaFinalizacion ? fechaFinalizacion.toISOString().slice(11, 16) : '');
        setPreguntas(preguntaMap.length > 0 ? preguntaMap : [emptyPregunta()]);
        if (preguntaMap[0]) {
          setUnidadUnicaId(preguntaMap[0].unidadId);
          setTemaUnicoId(preguntaMap[0].temaId);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError('No se pudo cargar el quiz para editarlo.');
      } finally {
        setLoading(false);
      }
    }

    void cargarQuizExistente();
  }, [esEdicion, quizId, conceptos, temas, unidades]);

  function handleCambiarTipo(nuevoTipo: TipoQuiz) {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'unico') {
      setPreguntas((prev) => prev.map((pregunta) => ({ ...pregunta, unidadId: unidadUnicaId, temaId: temaUnicoId, conceptoId: '' })));
    }
  }

  function handleCambiarUnidadUnica(unidadId: string) {
    const nuevoTema = temasDeUnidad(unidadId)[0]?.id ?? '';
    setUnidadUnicaId(unidadId);
    setTemaUnicoId(nuevoTema);
    setPreguntas((prev) => prev.map((pregunta) => ({ ...pregunta, unidadId, temaId: nuevoTema, conceptoId: '' })));
  }

  function handleCambiarTemaUnico(temaId: string) {
    setTemaUnicoId(temaId);
    setPreguntas((prev) => prev.map((pregunta) => ({ ...pregunta, temaId, conceptoId: '' })));
  }

  function updatePregunta(id: string, cambios: Partial<Pregunta>) {
    setPreguntas((prev) => prev.map((pregunta) => (pregunta.id === id ? { ...pregunta, ...cambios } : pregunta)));
  }

  function handleCambiarUnidadPregunta(id: string, unidadId: string) {
    const nuevoTema = temasDeUnidad(unidadId)[0]?.id ?? '';
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
    setPreguntas((prev) => (prev.length <= 1 ? prev : prev.filter((pregunta) => pregunta.id !== id)));
  }

  function updateOption(preguntaId: string, opcionId: string, texto: string) {
    setPreguntas((prev) => prev.map((pregunta) =>
      pregunta.id !== preguntaId ? pregunta : {
        ...pregunta,
        opciones: pregunta.opciones.map((opcion) => opcion.id === opcionId ? { ...opcion, texto } : opcion),
      },
    ));
  }

  function addOption(preguntaId: string) {
    setPreguntas((prev) => prev.map((pregunta) =>
      pregunta.id === preguntaId ? { ...pregunta, opciones: [...pregunta.opciones, emptyOpcion()] } : pregunta,
    ));
  }

  function deleteOption(preguntaId: string, opcionId: string) {
    setPreguntas((prev) => prev.map((pregunta) => {
      if (pregunta.id !== preguntaId || pregunta.opciones.length <= 2) return pregunta;
      return { ...pregunta, opciones: pregunta.opciones.filter((opcion) => opcion.id !== opcionId) };
    }));
  }

  function markCorrect(preguntaId: string, opcionId: string) {
    setPreguntas((prev) => prev.map((pregunta) =>
      pregunta.id !== preguntaId ? pregunta : {
        ...pregunta,
        opciones: pregunta.opciones.map((opcion) => ({ ...opcion, esCorrecta: opcion.id === opcionId })),
      },
    ));
  }

  function validate(): string | null {
    if (!titulo.trim()) return 'El quiz necesita un título.';
    if (!code) return 'No se pudo identificar el grupo del quiz.';

    if (tipo === 'unico' && (!unidadUnicaId || !temaUnicoId)) {
      return 'Selecciona la unidad y el tema del quiz.';
    }

    const apertura = combinarFechaHora(fechaApertura, horaApertura);
    const cierre = combinarFechaHora(fechaCierre, horaCierre);
    if (!apertura || !cierre) return 'Define la fecha y hora de apertura y de cierre.';
    if (cierre <= apertura) return 'La fecha de cierre debe ser posterior a la de apertura.';

    if (preguntas.length === 0) return 'Agrega al menos una pregunta.';

    for (let i = 0; i < preguntas.length; i += 1) {
      const pregunta = preguntas[i];
      if (tipo === 'acumulativo' && (!pregunta.unidadId || !pregunta.temaId)) {
        return `Selecciona unidad y tema en la pregunta ${i + 1}.`;
      }
      if (!pregunta.conceptoId) return `Selecciona el concepto de la pregunta ${i + 1}.`;
      if (!pregunta.enunciado.trim()) return `La pregunta ${i + 1} no tiene enunciado.`;
      if (pregunta.opciones.some((opcion) => !opcion.texto.trim())) {
        return `Todas las opciones de la pregunta ${i + 1} deben tener texto.`;
      }
      if (!pregunta.opciones.some((opcion) => opcion.esCorrecta)) {
        return `Marca la respuesta correcta de la pregunta ${i + 1}.`;
      }
    }

    return null;
  }

  async function handleSubmit() {
    const mensaje = validate();
    if (mensaje) {
      setError(mensaje);
      return;
    }

    if (!code) {
      setError('No se pudo localizar el grupo asociado al quiz.');
      return;
    }

    try {
      setError(null);
      const inicio = combinarFechaHora(fechaApertura, horaApertura);
      const fin = combinarFechaHora(fechaCierre, horaCierre);

      if (!inicio || !fin) {
        setError('Las fechas del quiz son inválidas.');
        return;
      }

      const payloadQuiz = {
        id: esEdicion && quizId ? quizId : crypto.randomUUID(),
        nombre: titulo.trim(),
        fechaInicio: inicio.toISOString(),
        fechaFinalizacion: fin.toISOString(),
        grupoId: code,
      };

      const quizResponse = esEdicion && quizId
        ? await apiClient.patch(`/api/quizzes/${quizId}`, payloadQuiz)
        : await apiClient.post('/api/quizzes', payloadQuiz);

      const createdQuizId = (quizResponse.data as { id?: string }).id ?? quizId ?? payloadQuiz.id;

      for (const pregunta of preguntas) {
        const createdPreguntaResponse = await apiClient.post('/api/preguntas', {
          id: pregunta.id.startsWith('preg-') || pregunta.id.startsWith('preg-mock-') ? crypto.randomUUID() : pregunta.id,
          descripcion: pregunta.enunciado.trim(),
          conceptoId: pregunta.conceptoId,
        });

        const createdPreguntaId = (createdPreguntaResponse.data as { id?: string }).id;
        if (!createdPreguntaId) continue;

        await apiClient.post('/api/quiz-x-pregunta', {
          id: crypto.randomUUID(),
          quizId: createdQuizId,
          preguntaId: createdPreguntaId,
        });

        for (const opcion of pregunta.opciones) {
          await apiClient.post('/api/opciones', {
            id: crypto.randomUUID(),
            descripcion: opcion.texto.trim(),
            esCorrecta: opcion.esCorrecta,
            preguntaId: createdPreguntaId,
          });
        }
      }

      navigate(`/grupos/${code}`);
    } catch (requestError) {
      console.error('Error saving quiz', requestError);
      setError('No se pudo guardar el quiz en el backend. Revisa la información y vuelve a intentarlo.');
    }
  }

  if (!code) {
    return <p className="qn-empty">No se pudo identificar el grupo del quiz.</p>;
  }

  if (loading) {
    return (
      <article className="qn-screen">
        <header className="qn-topbar">
          <button className="qn-icon-btn" onClick={toggleSidebar} aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list"></i>
          </button>
          <span className="qn-topbar-title">Docente</span>
        </header>
        <article className="qn-body">
          <p className="qn-empty">Cargando quiz...</p>
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
          <p className="qn-subtitle">Grupo {code}</p>
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
              <button type="button" className={`qn-tipo-btn ${tipo === 'unico' ? 'active' : ''}`} onClick={() => handleCambiarTipo('unico')}>
                Un solo tema
              </button>
              <button type="button" className={`qn-tipo-btn ${tipo === 'acumulativo' ? 'active' : ''}`} onClick={() => handleCambiarTipo('acumulativo')}>
                Acumulativo / diagnóstico
              </button>
            </article>
          </article>

          {tipo === 'unico' && (
            <article className="qn-field-row">
              <label className="qn-field">
                <span className="qn-field-label">Unidad</span>
                <select className="qn-input" value={unidadUnicaId} onChange={(e) => handleCambiarUnidadUnica(e.target.value)}>
                  <option value="">Selecciona una unidad</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>{unidad.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="qn-field">
                <span className="qn-field-label">Tema</span>
                <select className="qn-input" value={temaUnicoId} onChange={(e) => handleCambiarTemaUnico(e.target.value)} disabled={!unidadUnicaId}>
                  <option value="">{unidadUnicaId ? 'Selecciona un tema' : 'Primero elige una unidad'}</option>
                  {temasDeUnidad(unidadUnicaId).map((tema) => (
                    <option key={tema.id} value={tema.id}>{tema.nombre}</option>
                  ))}
                </select>
              </label>
            </article>
          )}

          <article className="qn-field-row">
            <label className="qn-field">
              <span className="qn-field-label">Fecha de apertura</span>
              <input className="qn-input" type="date" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} />
            </label>
            <label className="qn-field">
              <span className="qn-field-label">Hora de apertura</span>
              <input className="qn-input" type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} />
            </label>
          </article>

          <article className="qn-field-row">
            <label className="qn-field">
              <span className="qn-field-label">Fecha de cierre</span>
              <input className="qn-input" type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
            </label>
            <label className="qn-field">
              <span className="qn-field-label">Hora de cierre</span>
              <input className="qn-input" type="time" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} />
            </label>
          </article>

          <article className="qn-toggle-row">
            <span className="qn-field-label">El alumno puede ver sus respuestas antes del cierre</span>
            <button type="button" role="switch" aria-checked={verRespuestasAntesCierre} className={`qn-switch ${verRespuestasAntesCierre ? 'on' : ''}`} onClick={() => setVerRespuestasAntesCierre((valor) => !valor)}>
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
                  <button type="button" className="qn-icon-danger" onClick={() => deleteQuestion(pregunta.id)} aria-label={`Eliminar pregunta ${index + 1}`}>
                    <i className="bi bi-trash"></i>
                  </button>
                </article>

                {tipo === 'acumulativo' && (
                  <article className="qn-field-row">
                    <label className="qn-field">
                      <span className="qn-field-label">Unidad</span>
                      <select className="qn-input" value={unidadPregunta} onChange={(e) => handleCambiarUnidadPregunta(pregunta.id, e.target.value)}>
                        <option value="">Selecciona una unidad</option>
                        {unidades.map((unidad) => (
                          <option key={unidad.id} value={unidad.id}>{unidad.nombre}</option>
                        ))}
                      </select>
                    </label>
                    <label className="qn-field">
                      <span className="qn-field-label">Tema</span>
                      <select className="qn-input" value={temaPregunta} onChange={(e) => handleCambiarTemaPregunta(pregunta.id, e.target.value)} disabled={!unidadPregunta}>
                        <option value="">{unidadPregunta ? 'Selecciona un tema' : 'Primero elige una unidad'}</option>
                        {temasDeUnidad(unidadPregunta).map((tema) => (
                          <option key={tema.id} value={tema.id}>{tema.nombre}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                )}

                <label className="qn-field">
                  <span className="qn-field-label">Enunciado</span>
                  <input className="qn-input" type="text" placeholder="Escribe la pregunta..." value={pregunta.enunciado} onChange={(e) => updatePregunta(pregunta.id, { enunciado: e.target.value })} />
                </label>

                <label className="qn-field">
                  <span className="qn-field-label">Concepto relacionado</span>
                  <select className="qn-input" value={pregunta.conceptoId} onChange={(e) => updatePregunta(pregunta.id, { conceptoId: e.target.value })} disabled={!temaPregunta}>
                    <option value="">{temaPregunta ? 'Selecciona un concepto' : 'Elige unidad y tema primero'}</option>
                    {conceptosDeTema(temaPregunta).map((concepto) => (
                      <option key={concepto.id} value={concepto.id}>{concepto.nombre}</option>
                    ))}
                  </select>
                </label>

                <article className="qn-field">
                  <span className="qn-field-label">Opciones de respuesta — cada pregunta tiene una sola respuesta válida</span>
                  {pregunta.opciones.map((opcion, opIndex) => (
                    <article key={opcion.id} className="qn-opcion-row">
                      <input className="qn-input qn-opcion-input" type="text" placeholder="Texto de la opción..." value={opcion.texto} onChange={(e) => updateOption(pregunta.id, opcion.id, e.target.value)} />
                      <label className="qn-correcta-label">
                        <input type="radio" name={`correcta-${pregunta.id}`} checked={opcion.esCorrecta} onChange={() => markCorrect(pregunta.id, opcion.id)} />
                        Correcta
                      </label>
                      {pregunta.opciones.length > 2 && (
                        <button type="button" className="qn-icon-danger" onClick={() => deleteOption(pregunta.id, opcion.id)} aria-label={`Eliminar opción ${opIndex + 1}`}>
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
          <button type="button" className="qn-btn-primary" onClick={() => { void handleSubmit(); }}>
            {esEdicion ? 'Guardar Cambios' : 'Crear Quiz'}
          </button>
        </footer>
      </article>
    </article>
  );
}