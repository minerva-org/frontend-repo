import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import SidebarToggleIcon from '../components/common/SidebarToggleIcon.tsx';
import TaskGeneratingOverlay from '../components/common/TaskGeneratingOverlay.tsx';
import Toast, { type ToastData } from '../components/common/Toast.tsx';
import { apiClient } from '../services/ApiClient';
import '../styles/QuizNuevo.css';
import { mapearCurriculoQuiz } from '../utils/quizCurriculo';
import { useTaskPolling } from '../hooks/useTaskPolling';
import {
  createQuizGenerationTask,
  getQuizGenerationTask,
  cancelQuizGenerationTask,
} from '../services/QuizIaService';

import type {
  QuizBackend,
  UnidadCatalogo,
  TemaCatalogo,
  ConceptoCatalogo,
  Opcion,
  Pregunta,
  PreguntaQuizResponse,
  OpcionQuizResponse,
  QuizXPreguntaResponse,
  CurriculoGrupoCatalogo,
  QuizGenerationTaskStatus,
} from '../types/QuizTypes';

interface GrupoQuizBackend {
  id: string;
  nombre: string;
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
  const { role } = useAuth();
  const puedeGestionar =
    role === 'docente' ||
    role === 'coordinador' ||
    role === 'dev';
  const esEdicion = !!quizId;

  const [unidades, setUnidades] = useState<UnidadCatalogo[]>([]);
  const [temas, setTemas] = useState<TemaCatalogo[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoCatalogo[]>([]);
  const [titulo, setTitulo] = useState('');
  const [fechaApertura, setFechaApertura] = useState('');
  const [horaApertura, setHoraApertura] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [horaCierre, setHoraCierre] = useState('');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizCargado, setQuizCargado] = useState(false);
  const [preguntasEliminadas, setPreguntasEliminadas] = useState<{preguntaId:string; quizXPreguntaId?:string}[]>([]);
  const [opcionesOriginales, setOpcionesOriginales] = useState<Record<string, Opcion[]>>({});
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [quizPrompt, setQuizPrompt] = useState('');
  const [quizCurriculo, setQuizCurriculo] =
    useState<CurriculoGrupoCatalogo | null>(null);

  const temasDeUnidad = useMemo(
    () => (unidadId: string) => temas.filter((tema) => tema.unidadId === unidadId),
    [temas],
  );

  const conceptosDeTema = useMemo(
    () => (temaId: string) => conceptos.filter((concepto) => concepto.temaId === temaId),
    [conceptos],
  );

  const quizPolling = useTaskPolling<QuizGenerationTaskStatus>({
    enabled: true,
    fetchStatus: (tareaId) =>
      getQuizGenerationTask(code ?? '', tareaId),
    cancelStatus: (tareaId) =>
      cancelQuizGenerationTask(code ?? '', tareaId),
  });

  const generandoPreguntas =
    quizPolling.taskId !== null
    && quizPolling.status?.estado !== 'COMPLETADA'
    && quizPolling.status?.estado !== 'ERROR';

  useEffect(() => {
    if (!quizPolling.error) return;
    setError(quizPolling.error);
  }, [quizPolling.error]);

  useEffect(() => {
    if (quizPolling.status?.estado === 'ERROR') {
      setError(
        quizPolling.status.error
        || 'No se pudieron generar las preguntas.',
      );
      void quizPolling.cancel();
    }
    if (quizPolling.status?.estado !== 'COMPLETADA') return;
    const resultado = quizPolling.status.resultado;
    if (!resultado?.questions?.length) {
      setError('El servicio de IA no devolvió preguntas válidas.');
      void quizPolling.cancel();
      return;
    }

    const preguntasIncompletas = resultado.questions.find(
      (question) => !question.question?.trim()
        || !question.conceptName?.trim()
        || !question.conceptId?.trim(),
    );
    if (preguntasIncompletas) {
      setError('El modelo devolvió una pregunta incompleta.');
      void quizPolling.cancel();
      return;
    }

    const mappedQuestions = resultado.questions.map((question) => {
      const concepto = conceptos.find(
        (item) =>
          item.id === question.conceptId
          || item.idConceptoOrigen === question.conceptId
          || (!!question.conceptName && item.nombre.localeCompare(
            question.conceptName,
            'es',
            { sensitivity: 'base' },
          ) === 0),
      );
      const tema = concepto
        ? temas.find((item) => item.id === concepto.temaId)
        : undefined;
      const unidad = tema
        ? unidades.find((item) => item.id === tema.unidadId)
        : undefined;
      return { question, concepto, tema, unidad };
    });
    const noAsociada = mappedQuestions.find(
      ({ concepto }) => !concepto,
    );
    if (noAsociada) {
      setError(
        `No se pudo asociar la pregunta generada al concepto "${noAsociada.question.conceptName || noAsociada.question.conceptId}".`,
      );
      void quizPolling.cancel();
      return;
    }

    const generated = mappedQuestions.map(({ question, concepto, tema, unidad }) => {
      return {
        id: newId('preg'),
        unidadId: unidad?.id ?? '',
        temaId: tema?.id ?? '',
        conceptoId: concepto!.id,
        enunciado: question.question,
        opciones: question.options.map((option) => ({
          id: newId('op'),
          texto: option.text,
          esCorrecta: option.isCorrect,
        })),
      };
    });
    setPreguntas(generated);
    void quizPolling.cancel();
  }, [quizPolling.status]);

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        if (!code) {
          throw new Error('No se pudo identificar el grupo del quiz.');
        }

        const [grupoResponse, curriculoResponse] = await Promise.all([
          apiClient.get<GrupoQuizBackend>(
            `/api/grupos/${encodeURIComponent(code)}`,
          ),
          apiClient.get<CurriculoGrupoCatalogo>(
            `/api/grupos/${encodeURIComponent(code)}/curriculo`,
          ),
        ]);
        setNombreGrupo(grupoResponse.data?.nombre?.trim() || code);
        const curriculo = curriculoResponse.data;
        setQuizCurriculo(curriculo);

        const { unidades: unidadesData, temas: temasData, conceptos: conceptosData } =
          mapearCurriculoQuiz(curriculo);

        setUnidades(unidadesData);
        setTemas(temasData);
        setConceptos(conceptosData);

        if (!esEdicion) {
          setPreguntas([
            emptyPregunta(),
          ]);
        }
      } catch {
        setError('No se pudo cargar el currículo del grupo. Intenta recargar la página.');
      } finally {
        setLoading(false);
        setQuizCargado(true);
      }
    }

    void cargarCatalogo();
  }, [esEdicion, code]);

  useEffect(() => {
    if (!esEdicion || !quizId || !quizCargado) return;

    async function cargarQuizExistente() {
      try {
        setLoading(true);
        const [quizResponse, preguntasResponse, relacionesResponse] = await Promise.all([
          apiClient.get<QuizBackend>(`/api/quizzes/${quizId}`),
          apiClient.get<PreguntaQuizResponse[]>(`/api/quizzes/${quizId}/preguntas`),
          apiClient.get<QuizXPreguntaResponse[]>('/api/quiz-x-pregunta'), 
        ]);

        const quiz = quizResponse.data;
        const questionList = preguntasResponse.data ?? [];
        const relaciones = (relacionesResponse.data ?? []).filter((relacion) => relacion.quizId ===quizId);
        const preguntaMap = await Promise.all(
          questionList.map(async (pregunta) => {
            const opcionesResponse = await apiClient.get<OpcionQuizResponse[]>(`/api/opciones?preguntaId=${pregunta.id}`);
            const opciones = (opcionesResponse.data ?? []).map((opcion) => ({
              id: opcion.id,
              texto: opcion.descripcion,
              esCorrecta: Boolean(opcion.esCorrecta),
            }));

            const concepto = conceptos.find((item) =>
              item.id === pregunta.conceptoId ||
              item.idConceptoOrigen === pregunta.conceptoId
            );
            const tema = concepto ? temas.find((item) => item.id === concepto.temaId) : undefined;
            const unidad = tema ? unidades.find((item) => item.id === tema.unidadId) : undefined;
            const relacion = relaciones.find((item) => 
            item.preguntaId ===pregunta.id);
            if(!relacion){
              throw new Error(`No se encontró la relacion del quiz para la pregunta ${pregunta.id}`,);
            }

            return {
              id: pregunta.id,
              quizXPreguntaId:relacion.id,
              unidadId: unidad?.id ?? '',
              temaId: tema?.id ?? '',
              conceptoId: concepto?.id ?? '',
              enunciado: pregunta.descripcion,
              opciones: opciones.length > 0 ? opciones : [emptyOpcion(), emptyOpcion()],
            } satisfies Pregunta;
          }),
        );

        setOpcionesOriginales(Object.fromEntries(preguntaMap.map((pregunta) => [
          pregunta.id,
          pregunta.opciones.map((opcion) => ({...opcion})),
        ])
      )
    );

        const fechaInicio = quiz.fechaInicio ? new Date(quiz.fechaInicio) : null;
        const fechaFinalizacion = quiz.fechaFinalizacion ? new Date(quiz.fechaFinalizacion) : null;

        setTitulo(quiz.nombre ?? '');
        setFechaApertura(
          fechaInicio && !Number.isNaN(fechaInicio.getTime())
            ? `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}-${String(fechaInicio.getDate()).padStart(2, '0')}`
            : ''
        );

        setHoraApertura(
          fechaInicio && !Number.isNaN(fechaInicio.getTime())
            ? `${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}`
            : ''
        );

        setFechaCierre(
          fechaFinalizacion && !Number.isNaN(fechaFinalizacion.getTime())
            ? `${fechaFinalizacion.getFullYear()}-${String(fechaFinalizacion.getMonth() + 1).padStart(2, '0')}-${String(fechaFinalizacion.getDate()).padStart(2, '0')}`
            : ''
        );

        setHoraCierre(
          fechaFinalizacion && !Number.isNaN(fechaFinalizacion.getTime())
            ? `${String(fechaFinalizacion.getHours()).padStart(2, '0')}:${String(fechaFinalizacion.getMinutes()).padStart(2, '0')}`
            : ''
        );
        setPreguntas(preguntaMap.length > 0 ? preguntaMap : [emptyPregunta()]);
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError('No se pudo cargar el quiz para editarlo.');
      } finally {
        setLoading(false);
      }
    }

    void cargarQuizExistente();
  }, [esEdicion, quizId, conceptos, temas, unidades,quizCargado]);

  function updatePregunta(id: string, cambios: Partial<Pregunta>) {
    setPreguntas((prev) => prev.map((pregunta) => (pregunta.id === id ? { ...pregunta, ...cambios } : pregunta)));
  }

  async function generarPreguntas() {
    if (!code) {
      setError('No se pudo identificar el grupo.');
      return;
    }
    if (!quizCurriculo) {
      setError('No se pudo cargar el currículo del grupo.');
      return;
    }

    const conceptosElegibles =
      quizCurriculo.unidades.flatMap((unidad) =>
        (unidad.temas ?? []).flatMap((tema) =>
          (tema.conceptos ?? [])
            .filter((concepto) =>
              concepto.activo !== false
              && (concepto.contenidos ?? []).length > 0,
            )
            .map((concepto) => ({
              id: concepto.id,
              nombre: concepto.nombre,
              contenido: concepto.contenidos ?? [],
            })),
        ),
      );

    if (conceptosElegibles.length === 0) {
      setError(
        'No hay conceptos con contenido relacionado. Agrega contenido a conceptos del currículo antes de generar preguntas.',
      );
      return;
    }

    setError(null);
    try {
      const tareaId = await createQuizGenerationTask(code, {
        prompt: quizPrompt.trim()
          || 'Genera 10 preguntas variadas, combinando verdadero/falso y opcion multiple.',
        arbol: quizCurriculo,
      });
      quizPolling.start(tareaId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudieron generar las preguntas.',
      );
    }
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
      emptyPregunta(),
    ]);
  }

  function deleteQuestion(id: string) {
      if(preguntas.length <= 1) return;

      const preguntaEliminada = preguntas.find((pregunta) => pregunta.id ===id);

      if (!preguntaEliminada) return;

      if(!preguntaEliminada.id.startsWith('preg-')){
        setPreguntasEliminadas((eliminadas) => {
          if (eliminadas.some((item) => item.preguntaId === preguntaEliminada.id)) {
            return eliminadas;
          }

          return [
            ...eliminadas,
            {
              preguntaId: preguntaEliminada.id,
              quizXPreguntaId: preguntaEliminada.quizXPreguntaId,
            },
          ];
        });
          
      }
      setPreguntas((prev) =>
      prev.filter((pregunta) => pregunta.id !== id));
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
  
  async function guardarOpciones(
    idOriginalPregunta: string,
    preguntaIdBackend: string,
    opcionesActuales: Opcion[],
    esPreguntaNueva: boolean
  ) {
    const opcionesOrdenadas = [...opcionesActuales];

    if (esPreguntaNueva) {
      for (const opcion of opcionesOrdenadas) {
        await apiClient.post('/api/opciones', {
          id: crypto.randomUUID(),
          descripcion: opcion.texto.trim(),
          esCorrecta: opcion.esCorrecta,
          preguntaId: preguntaIdBackend,
        });
      }

      return;
    }

    const originales = opcionesOriginales[idOriginalPregunta] ?? [];

    const idsActuales = new Set(
      opcionesActuales
        .filter((opcion) => !opcion.id.startsWith('op-'))
        .map((opcion) => opcion.id),
    );

    const eliminadas = originales.filter(
      (opcion) => !idsActuales.has(opcion.id),
    );

    for (const opcion of eliminadas) {
      await apiClient.delete(`/api/opciones/${opcion.id}`);
    }

    for (const opcion of opcionesOrdenadas) {
      if (opcion.id.startsWith('op-')) {
        await apiClient.post('/api/opciones', {
          id: crypto.randomUUID(),
          descripcion: opcion.texto.trim(),
          esCorrecta: opcion.esCorrecta,
          preguntaId: preguntaIdBackend,
        });
      } else {
        await apiClient.patch(`/api/opciones/${opcion.id}`, {
          descripcion: opcion.texto.trim(),
          esCorrecta: opcion.esCorrecta,
          preguntaId: preguntaIdBackend,
        });
      }
    }
  }

  function validate(): string | null {
    if (!titulo.trim()) return 'El quiz necesita un título.';
    if (!code) return 'No se pudo identificar el grupo del quiz.';

    const apertura = combinarFechaHora(fechaApertura, horaApertura);
    const cierre = combinarFechaHora(fechaCierre, horaCierre);
    if (!apertura || !cierre) return 'Define la fecha y hora de apertura y de cierre.';
    if (cierre <= apertura) return 'La fecha de cierre debe ser posterior a la de apertura.';

    if (preguntas.length === 0) return 'Agrega al menos una pregunta.';

    for (let i = 0; i < preguntas.length; i += 1) {
      const pregunta = preguntas[i];
      if (!pregunta.unidadId || !pregunta.temaId) {
        return `Selecciona unidad y tema en la pregunta ${i + 1}.`;
      }
      if (!pregunta.conceptoId) return `Selecciona el concepto de la pregunta ${i + 1}.`;
      if (!pregunta.enunciado.trim()) return `La pregunta ${i + 1} no tiene enunciado.`;
      if (pregunta.opciones.some((opcion) => !opcion.texto.trim())) {
        return `Todas las opciones de la pregunta ${i + 1} deben tener texto.`;
      }
      if (pregunta.opciones.filter((opcion) => opcion.esCorrecta).length !== 1) {
        return `La pregunta ${i + 1} solo puede tener una respuesta correcta.`;
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

      let createdQuizId: string | null = null;
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

        createdQuizId =
          (quizResponse.data as { id?: string }).id ?? quizId ?? payloadQuiz.id;

        if (!esEdicion) {
          for (const pregunta of preguntas) {
            const preguntaId = crypto.randomUUID();

            await apiClient.post('/api/preguntas', {
              id: preguntaId,
              descripcion: pregunta.enunciado.trim(),
              conceptoId: pregunta.conceptoId,
              grupoId: code,
            });

            await apiClient.post('/api/quiz-x-pregunta', {
              id: crypto.randomUUID(),
              quizId: createdQuizId,
              preguntaId,
            });

            await guardarOpciones(
              pregunta.id,
              preguntaId,
              pregunta.opciones,
              true,
            );
          }
        } else {
            for (const pregunta of preguntas) {
              const esPreguntaNueva = pregunta.id.startsWith('preg-');

              let preguntaId = pregunta.id;

              if (esPreguntaNueva) {
                preguntaId = crypto.randomUUID();

                await apiClient.post('/api/preguntas', {
                  id: preguntaId,
                  descripcion: pregunta.enunciado.trim(),
                  conceptoId: pregunta.conceptoId,
                  grupoId: code,
                });

                await apiClient.post('/api/quiz-x-pregunta', {
                  id: crypto.randomUUID(),
                  quizId: createdQuizId,
                  preguntaId,
                });
              } else {
                await apiClient.patch(`/api/preguntas/${pregunta.id}`, {
                  descripcion: pregunta.enunciado.trim(),
                  conceptoId: pregunta.conceptoId,
                  grupoId: code,
                });
              }

              await guardarOpciones(
                pregunta.id,
                preguntaId,
                pregunta.opciones,
                esPreguntaNueva,
              );
            }

            for (const preguntaEliminada of preguntasEliminadas) {
              if (preguntaEliminada.quizXPreguntaId) {
                await apiClient.delete(`/api/quiz-x-pregunta/${preguntaEliminada.quizXPreguntaId}`);
              }

              await apiClient.delete(`/api/preguntas/${preguntaEliminada.preguntaId}`);
            }
        }
        

        navigate(`/grupos/${code}`);

      } catch (requestError) {
        console.error('Error saving quiz:', requestError);
        if (!esEdicion && createdQuizId) {
          try {
            await apiClient.delete(`/api/quizzes/${createdQuizId}`);
          } catch (cleanupError) {
            console.error('Error cleaning incomplete quiz:', cleanupError);
          }
        }
        setError('Ocurrió un error al guardar el quiz. Intenta nuevamente más tarde.');
      }
  }

  if (!code) {
    return <p className="qn-empty">No se pudo identificar el grupo del quiz.</p>;
  }

  if (!puedeGestionar) {
    return (
      <article className="qn-screen">
        <header className="qn-topbar">
          <button className="qn-icon-btn" onClick={toggleSidebar} aria-label="Mostrar u ocultar menú">
            <SidebarToggleIcon />
          </button>
          <span className="qn-topbar-title">Quizzes</span>
        </header>
        <article className="qn-body">
          <p className="qn-empty">No tienes permiso para crear o editar quizzes.</p>
        </article>
      </article>
    );
  }

  if (loading) {
    return (
      <article className="qn-screen">
        <header className="qn-topbar">
          <button className="qn-icon-btn" onClick={toggleSidebar} aria-label="Mostrar u ocultar menú">
            <SidebarToggleIcon />
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
          <SidebarToggleIcon />
        </button>
        <span className="qn-topbar-title">Docente</span>
      </header>

      <article className="qn-body">
        <header className="qn-header">
          <h1 className="qn-title">{esEdicion ? 'Editar quiz' : 'Crear nuevo quiz'}</h1>
          <p className="qn-subtitle">Grupo {nombreGrupo || code}</p>
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
              <span className="qn-tipo-btn active">
                Acumulativo / diagnóstico
              </span>
            </article>
          </article>

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

        </section>

        <section className="qn-section">
          <h2 className="qn-preguntas-title">Preguntas ({preguntas.length})</h2>

          <article className="qn-ai-generator">
            <label className="qn-field">
              <span className="qn-field-label">
                Describe el contenido o estilo del quiz
              </span>
              <textarea
                className="qn-input qn-ai-prompt"
                rows={3}
                value={quizPrompt}
                onChange={(event) => setQuizPrompt(event.target.value)}
                placeholder="Ejemplo: Haz énfasis en algoritmos de búsqueda y dificultad intermedia."
              />
            </label>
            <button
              type="button"
              className="qn-btn-primary qn-ai-button"
              disabled={generandoPreguntas}
              onClick={() => void generarPreguntas()}
            >
              <i className={
                generandoPreguntas
                  ? 'bi bi-arrow-repeat me-2'
                  : 'bi bi-stars me-2'
              }></i>
              {generandoPreguntas
                ? 'Generando preguntas...'
                : 'Generar preguntas y respuestas'}
            </button>
            <small className="qn-ai-legend">
              Solo se generarán preguntas para conceptos que tengan contenido relacionado.
            </small>
          </article>

          {preguntas.map((pregunta, index) => {
            const unidadPregunta = pregunta.unidadId;
            const temaPregunta = pregunta.temaId;

            return (
              <article key={pregunta.id} className="qn-pregunta">
                <article className="qn-pregunta-top">
                  <span className="qn-pregunta-label">Pregunta {index + 1}</span>
                  <button type="button" className="qn-icon-danger" onClick={() => deleteQuestion(pregunta.id)} aria-label={`Eliminar pregunta ${index + 1}`}>
                    <i className="bi bi-trash"></i>
                  </button>
                </article>

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
                  <small className="text-secondary d-block mb-2">
                    Las opciones se muestran a los alumnos en un orden aleatorio.
                  </small>
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

        <footer className="qn-footer">
          <button type="button" className="qn-btn-secondary" onClick={() => navigate(`/grupos/${code}`)}>
            Cancelar
          </button>
          <button type="button" className="qn-btn-primary" onClick={() => { void handleSubmit(); }}>
            {esEdicion ? 'Guardar Cambios' : 'Crear Quiz'}
          </button>
        </footer>
      </article>

      <TaskGeneratingOverlay
        visible={generandoPreguntas}
        title="Generando preguntas del quiz"
        subtitle={quizPolling.status?.progreso
          || 'Esto puede tardar unos minutos'}
        onCancel={() => void quizPolling.cancel()}
      />
      <Toast
        toast={error
          ? { tipo: 'error', mensaje: error } satisfies ToastData
          : null}
        onCerrar={() => setError(null)}
      />
    </article>
  );
}