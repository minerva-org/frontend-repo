
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient';

import type {
    QuizBackend,
    IntentoResponse,
    PreguntaAlumno,
    ResultadoIntento
} from '../types/QuizTypes.ts';

import '../styles/QuizAlumno.css';

type Estado = 'en_curso' | 'confirmado';

export default function QuizResolve() {
    const { code, quizId } = useParams<{
        code: string;
        quizId: string;
    }>();

    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<QuizBackend | null>(null);
    const [intentoId, setIntentoId] = useState('');
    const [preguntaActual, setPreguntaActual] = useState<PreguntaAlumno | null>(null);
    const [opcionSeleccionada, setOpcionSeleccionada] = useState('');
    const [preguntasRespondidas, setPreguntasRespondidas] = useState(0);
    const [preguntasVisitadas, setPreguntasVisitadas] = useState<PreguntaAlumno[]>([]);
    const [respuestasLocales, setRespuestasLocales] = useState<Record<string, string>>({});
    const [indiceActual, setIndiceActual] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');
    const [estado, setEstado] = useState<Estado>('en_curso');
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);
    const [resultado, setResultado] = useState<ResultadoIntento | null>(null);
    const [envioAutomatico, setEnvioAutomatico] = useState(false);
    const finalizacionIniciada = useRef(false);


    useEffect(() => {
        let cancelado = false;

        async function cargarIntento() {
            if (!quizId) {
                setError('No se proporcionó el identificador del quiz.');
                setCargando(false);
                return;
            }

            try {
                setCargando(true);
                setError('');

                const quizResponse = await apiClient.get<QuizBackend>(
                    `/api/quizzes/${quizId}`
                );

                const intentoResponse = await apiClient.post<IntentoResponse>(
                    `/api/quizzes/${quizId}/intentos`
                );

                if (cancelado) return;

                const quizData = quizResponse.data;
                const intento = intentoResponse.data;

                setQuiz(quizData);
                setIntentoId(intento.intentoId);

                setPreguntaActual(intento.preguntaActual);
                if (intento.preguntaActual) {
                    setPreguntasVisitadas([intento.preguntaActual]);
                    setIndiceActual(0);

                    setRespuestasLocales({
                        [intento.preguntaActual.id]: ''
                    });
                }
                setTiempoRestante(
                    Math.max(
                        0,
                        Math.floor(
                            (new Date(intento.fechaFinalizacion).getTime()
                                - Date.now()) / 1000
                        )
                    )
                );

                if (intento.preguntaActual) {
                    setPreguntasRespondidas(
                        intento.preguntaActual.numero - 1
                    );
                }

                if (intento.finalizado) {
                    const resultadoResponse =
                        await apiClient.post<ResultadoIntento>(
                            `/api/quizzes/${quizId}/intentos/${intento.intentoId}/finalizar`
                        );

                    if (cancelado) return;

                    setResultado(resultadoResponse.data);
                    setEstado('confirmado');
                } else {
                    setEstado('en_curso');
                }

            } catch (err) {
                if (!cancelado) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'No fue posible cargar el quiz.'
                    );
                }
            } finally {
                if (!cancelado) {
                    setCargando(false);
                }
            }
        }

        cargarIntento();

        return () => {
            cancelado = true;
        };
    }, [quizId]);

    const finalizarIntento = useCallback(async (automatico = false) => {
        if (!quizId || !intentoId || finalizacionIniciada.current) {
            return;
        }

        finalizacionIniciada.current = true;
        setEnvioAutomatico(automatico);
        setEnviando(true);
        setError('');

        try {
            const response = await apiClient.post<ResultadoIntento>(
                `/api/quizzes/${quizId}/intentos/${intentoId}/finalizar`
            );

            setResultado(response.data);
            setEstado('confirmado');
            setMostrarConfirmacion(false);

        } catch (err) {
            finalizacionIniciada.current = false;
            setError(
                err instanceof Error
                    ? err.message
                    : 'No fue posible finalizar el quiz.'
            );
        } finally {
            setEnviando(false);
        }
    }, [quizId, intentoId]);

    useEffect(() => {
        if (
            estado !== 'en_curso' ||
            !intentoId ||
            !preguntaActual
        ) {
            return;
        }

        const fechaFinal = preguntaActual
            ? null
            : null;

        const actualizarTiempo = () => {
            const limite = quiz?.fechaFinalizacion;

            if (!limite) return;

            const restante = Math.max(
                0,
                Math.floor(
                    (new Date(limite).getTime() - Date.now()) / 1000
                )
            );

            setTiempoRestante(restante);

            if (restante <= 0) {
                void finalizarIntento(true);
            }
        };

        actualizarTiempo();

        const temporizador = setInterval(actualizarTiempo, 1000);

        return () => clearInterval(temporizador);
    }, [estado, intentoId, preguntaActual, quiz, finalizarIntento]);

    // 4. Formatear tiempo
    const tiempoFormateado = useMemo(() => {
        const hora = Math.floor(tiempoRestante / 3600);
        const minuto = Math.floor((tiempoRestante % 3600) / 60);
        const segundo = tiempoRestante % 60;

        if (hora > 0) {
            return `${hora}:${minuto.toString().padStart(2, '0')}:${segundo
                .toString().padStart(2, '0')}`;
        }

        return `${minuto}:${segundo.toString().padStart(2, '0')}`;
    }, [tiempoRestante]);

    function regresarPregunta() {
        if (indiceActual <= 0 || enviando) return;

        // Conservamos la selección de la pregunta actual.
        const respuestasActualizadas = {
            ...respuestasLocales,
            [preguntaActual!.id]: opcionSeleccionada
        };

        setRespuestasLocales(respuestasActualizadas);

        // Recuperamos la pregunta anterior.
        const anterior = preguntasVisitadas[indiceActual - 1];

        setIndiceActual(indiceActual - 1);
        setPreguntaActual(anterior);

        // Recuperamos su opción seleccionada.
        setOpcionSeleccionada(
            respuestasActualizadas[anterior.id] ?? ''
        );
}

    async function guardarRespuesta() {
        if (!quizId || !intentoId || !preguntaActual || enviando) {
            return;
        }

    const respuestasActualizadas = {
        ...respuestasLocales,
        [preguntaActual.id]: opcionSeleccionada
    };

    setRespuestasLocales(respuestasActualizadas);

    if (indiceActual < preguntasVisitadas.length - 1) {
        const siguiente = preguntasVisitadas[indiceActual + 1];

        setIndiceActual(indiceActual + 1);
        setPreguntaActual(siguiente);

        setOpcionSeleccionada(
            respuestasActualizadas[siguiente.id] ?? ''
        );

        return;
    }

        setEnviando(true);
        setError('');

        try {
            const response = await apiClient.post<IntentoResponse>(
                `/api/quizzes/${quizId}/intentos/${intentoId}/respuestas`,
                {
                    preguntaId: preguntaActual.id,
                    opcionId: opcionSeleccionada || null,
                    cambiosPantalla: 0
                }
            );

            const intento = response.data;

            setPreguntasRespondidas(preguntaActual.numero);
            if (intento.preguntaActual) {
                setPreguntasVisitadas(prev => [
                    ...prev,
                    intento.preguntaActual!
                ]);

                setIndiceActual(prev => prev + 1);
                setPreguntaActual(intento.preguntaActual);
                setOpcionSeleccionada(
                    respuestasActualizadas[intento.preguntaActual.id] ?? ''
                );
            } else {
                setPreguntaActual(null);
                setOpcionSeleccionada('');
            }

            if (intento.finalizado) {
                finalizacionIniciada.current = true;

                const resultadoResponse =
                    await apiClient.post<ResultadoIntento>(
                        `/api/quizzes/${quizId}/intentos/${intentoId}/finalizar`
                    );

                setResultado(resultadoResponse.data);
                setEstado('confirmado');
            }

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No fue posible guardar tu respuesta.'
            );
        } finally {
            setEnviando(false);
        }
    }

    async function confirmarEnvio() {
        if (!quizId || !intentoId || enviando) return;

        finalizacionIniciada.current = true;
        setEnviando(true);
        setError('');

        try {
            if (preguntaActual) {
                await apiClient.post<IntentoResponse>(
                    `/api/quizzes/${quizId}/intentos/${intentoId}/respuestas`,
                    {
                        preguntaId: preguntaActual.id,
                        opcionId: opcionSeleccionada || null,
                        cambiosPantalla: 0
                    }
                );
            }

            const response = await apiClient.post<ResultadoIntento>(
                `/api/quizzes/${quizId}/intentos/${intentoId}/finalizar`
            );

            setResultado(response.data);
            setEstado('confirmado');
            setMostrarConfirmacion(false);

        } catch (err) {
            finalizacionIniciada.current = false;
            setError(
                err instanceof Error
                    ? err.message
                    : 'No fue posible enviar el quiz.'
            );
        } finally {
            setEnviando(false);
        }
    }

    if (cargando) {
        return (
            <article>
                <main>
                    <p>Cargando quiz...</p>
                </main>
            </article>
        );
    }

    if (error && !quiz) {
        return (
            <article>
                <main>
                    <p>{error}</p>
                    <button onClick={() => navigate(`/grupos/${code}`)}>
                        Volver al grupo
                    </button>
                </main>
            </article>
        );
    }

    if (!quiz) {
        return (
            <article>
                <main>
                    <p>Quiz no encontrado</p>
                    <button onClick={() => navigate(`/grupos/${code}`)}>
                        Volver al grupo
                    </button>
                </main>
            </article>
        );
    }

    if (estado === 'confirmado') {
        return (
            <article>
                <main>
                    <i className="bi bi-check-circle-fill"></i>

                    <h1>
                        {envioAutomatico
                            ? 'Tiempo agotado. Quiz finalizado'
                            : 'Quiz enviado'}
                    </h1>

                    {resultado && (
                        <>
                            <p>Respuestas correctas: {resultado.correctas}</p>
                            <p>Respuestas en blanco: {resultado.enBlanco}</p>
                            <p>Total de preguntas: {resultado.total}</p>
                        </>
                    )}
                </main>

                <button onClick={() => navigate(`/grupos/${code}`)}>
                    Volver al grupo
                </button>
            </article>
        );
    }

    const totalPreguntas = preguntaActual?.total ?? 0;
    const esUltimaPregunta =
        preguntaActual !== null &&
        preguntaActual.numero === preguntaActual.total;

    return (
        <article>
            <header>
                <span>{quiz.nombre}</span>

                <span>
                    <i className="bi bi-clock"></i>
                    {tiempoFormateado}
                </span>
            </header>

            {error && (
                <p role="alert">{error}</p>
            )}

            {preguntaActual ? (
                <>
                    <button disabled>
                        Pregunta {preguntaActual.numero} de {totalPreguntas}
                    </button>

                    <main>
                        <article>
                            <p>{preguntaActual.descripcion}</p>

                            <article>
                                {preguntaActual.opciones.map((opcion) => (
                                    <label
                                        key={opcion.id}
                                        className={
                                            opcionSeleccionada === opcion.id
                                                ? 'seleccionada'
                                                : ''
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name={`pregunta-${preguntaActual.id}`}
                                            checked={
                                                opcionSeleccionada === opcion.id
                                            }
                                            onChange={() =>
                                                setOpcionSeleccionada(opcion.id)
                                            }
                                            disabled={enviando}
                                        />

                                        {opcion.descripcion}
                                    </label>
                                ))}
                            </article>
                        </article>

                        <article>
                            <button
                                onClick={regresarPregunta}
                                disabled={indiceActual === 0 || enviando}
                            >
                                Anterior
                            </button>

                            {esUltimaPregunta ? (
                                <button
                                    onClick={() => setMostrarConfirmacion(true)}
                                    disabled={enviando}
                                >
                                    Finalizar
                                </button>
                            ) : (
                                <button
                                    onClick={guardarRespuesta}
                                    disabled={enviando}
                                >
                                    {enviando ? 'Guardando...' : 'Siguiente'}
                                </button>
                            )}
                        </article>
                    </main>
                </>
            ) : (
                <main>
                    <p>Ya no hay preguntas pendientes.</p>

                    <button
                        onClick={() => setMostrarConfirmacion(true)}
                        disabled={enviando}
                    >
                        Finalizar intento
                    </button>
                </main>
            )}

            {mostrarConfirmacion && (
                <article>
                    <article>
                        <h2>¿Deseas enviar tus respuestas?</h2>

                        <p>
                            Una vez finalizado el intento no podrás modificar
                            tus respuestas.
                        </p>

                        <article>
                            <button
                                onClick={() => setMostrarConfirmacion(false)}
                                disabled={enviando}
                            >
                                Seguir contestando
                            </button>

                            <button
                                onClick={confirmarEnvio}
                                disabled={enviando}
                            >
                                {enviando ? 'Enviando...' : 'Enviar'}
                            </button>
                        </article>
                    </article>
                </article>
            )}
        </article>
    );
}
