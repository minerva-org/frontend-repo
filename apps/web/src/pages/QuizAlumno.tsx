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
    //Se mantuvo esto para conservar el rerender pero se debe reconsiderar esta implementacion
    const [, setPreguntasRespondidas] = useState(0);
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

        const respuestasActualizadas = {
            ...respuestasLocales,
            [preguntaActual!.id]: opcionSeleccionada
        };

        setRespuestasLocales(respuestasActualizadas);

        const anterior = preguntasVisitadas[indiceActual - 1];

        setIndiceActual(indiceActual - 1);
        setPreguntaActual(anterior);

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

    // Pantalla de carga
    if (cargando) {
        return (
            <article className="qr-screen">
                <main className="qr-message container">
                    <article className="qr-message-card text-center">
                        <article className="spinner-border qr-spinner" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </article>
                        <p className="mb-0 mt-3">Cargando quiz...</p>
                    </article>
                </main>
            </article>
        );
    }

    // Error al cargar el quiz
    if (error && !quiz) {
        return (
            <article className="qr-screen">
                <main className="qr-message container">
                    <article className="qr-message-card text-center">
                        <i className="bi bi-exclamation-circle qr-message-icon"></i>
                        <p>{error}</p>

                        <button
                            className="btn btn-primary qr-btn-primary"
                            onClick={() => navigate(`/grupos/${code}`)}
                        >
                            Volver al grupo
                        </button>
                    </article>
                </main>
            </article>
        );
    }

    // Quiz no encontrado
    if (!quiz) {
        return (
            <article className="qr-screen">
                <main className="qr-message container">
                    <article className="qr-message-card text-center">
                        <i className="bi bi-search qr-message-icon"></i>
                        <p>Quiz no encontrado</p>

                        <button
                            className="btn btn-primary qr-btn-primary"
                            onClick={() => navigate(`/grupos/${code}`)}
                        >
                            Volver al grupo
                        </button>
                    </article>
                </main>
            </article>
        );
    }

    // Resultado del intento
    if (estado === 'confirmado') {
        return (
            <article className="qr-screen">
                <main className="qr-result container">
                    <section className="qr-result-card text-center">
                        <i className="bi bi-check-circle-fill qr-result-icon"></i>

                        <h1 className="qr-result-title">
                            {envioAutomatico
                                ? 'Tiempo agotado. Quiz finalizado'
                                : 'Quiz enviado'}
                        </h1>

                        <p className="qr-result-subtitle">
                            Tu intento ha sido registrado correctamente.
                        </p>

                        {resultado && (
                            <section className="qr-result-stats">
                                <article className="qr-stat">
                                    <span className="qr-stat-value">
                                        {resultado.correctas}
                                    </span>
                                    <span className="qr-stat-label">
                                        Respuestas correctas
                                    </span>
                                </article>

                                <article className="qr-stat">
                                    <span className="qr-stat-value">
                                        {resultado.enBlanco}
                                    </span>
                                    <span className="qr-stat-label">
                                        Respuestas en blanco
                                    </span>
                                </article>

                                <article className="qr-stat">
                                    <span className="qr-stat-value">
                                        {resultado.total}
                                    </span>
                                    <span className="qr-stat-label">
                                        Total de preguntas
                                    </span>
                                </article>
                            </section>
                        )}

                        <button
                            className="btn btn-primary qr-btn-primary qr-result-button"
                            onClick={() => navigate(`/grupos/${code}`)}
                        >
                            Volver al grupo
                        </button>
                    </section>
                </main>
            </article>
        );
    }

    const totalPreguntas = preguntaActual?.total ?? 0;

    const esUltimaPregunta =
        preguntaActual !== null &&
        preguntaActual.numero === preguntaActual.total;

    const progreso = totalPreguntas > 0 && preguntaActual
        ? (preguntaActual.numero / totalPreguntas) * 100
        : 0;

    return (
        <article className="qr-screen">
            <header className="qr-topbar">
                <article className="qr-topbar-content container-fluid">
                    <article className="qr-quiz-heading">
                        <span className="qr-quiz-label">Evaluación</span>
                        <h1 className="qr-quiz-title">{quiz.nombre}</h1>
                    </article>

                    <article className="qr-timer">
                        <i className="bi bi-clock"></i>
                        <article>
                            <span className="qr-timer-label">Tiempo restante</span>
                            <strong className="qr-timer-value">
                                {tiempoFormateado}
                            </strong>
                        </article>
                    </article>
                </article>
            </header>

            <main className="qr-content container">
                {error && (
                    <article className="alert alert-danger qr-alert" role="alert">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {error}
                    </article>
                )}

                {preguntaActual ? (
                    <>
                        <section className="qr-progress-section">
                            <article className="qr-progress-heading">
                                <span className="qr-progress-label">
                                    Progreso del cuestionario
                                </span>

                                <strong className="qr-progress-count">
                                    Pregunta {preguntaActual.numero} de {totalPreguntas}
                                </strong>
                            </article>

                            <article
                                className="progress qr-progress"
                                role="progressbar"
                                aria-label="Progreso del cuestionario"
                                aria-valuenow={progreso}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <article
                                    className="progress-bar qr-progress-bar"
                                    style={{ width: `${progreso}%` }}
                                />
                            </article>
                        </section>

                        <article className="qr-question-card">
                            <article className="qr-question-header">
                                <span className="qr-question-number">
                                    <i className="bi bi-question-circle"></i>
                                    Pregunta {preguntaActual.numero}
                                </span>

                                <span className="qr-question-total">
                                    {totalPreguntas} preguntas
                                </span>
                            </article>

                            <main className="qr-question-body">
                                <p className="qr-question-text">
                                    {preguntaActual.descripcion}
                                </p>

                                <section className="qr-options">
                                    <p className="qr-options-heading">
                                        Selecciona una respuesta:
                                    </p>

                                    {preguntaActual.opciones.map((opcion, index) => (
                                        <label
                                            key={opcion.id}
                                            className={`qr-option ${
                                                opcionSeleccionada === opcion.id
                                                    ? 'qr-option-selected'
                                                    : ''
                                            }`}
                                        >
                                            <input
                                                className="form-check-input qr-radio"
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

                                            <span className="qr-option-letter">
                                                {String.fromCharCode(65 + index)}
                                            </span>

                                            <span className="qr-option-text">
                                                {opcion.descripcion}
                                            </span>

                                            {opcionSeleccionada === opcion.id && (
                                                <i className="bi bi-check-circle-fill qr-option-check"></i>
                                            )}
                                        </label>
                                    ))}
                                </section>
                            </main>
                        </article>

                        <section className="qr-navigation">
                            <button
                                className="btn btn-outline-secondary qr-btn-secondary"
                                onClick={regresarPregunta}
                                disabled={indiceActual === 0 || enviando}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Anterior
                            </button>

                            {esUltimaPregunta ? (
                                <button
                                    className="btn btn-primary qr-btn-primary"
                                    onClick={() => setMostrarConfirmacion(true)}
                                    disabled={enviando}
                                >
                                    Finalizar
                                    <i className="bi bi-check-lg"></i>
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary qr-btn-primary"
                                    onClick={guardarRespuesta}
                                    disabled={enviando}
                                >
                                    {enviando ? 'Guardando...' : 'Siguiente'}
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            )}
                        </section>
                    </>
                ) : (
                    <main className="qr-empty-card text-center">
                        <i className="bi bi-clipboard-check qr-empty-icon"></i>
                        <h2>¡Has terminado las preguntas!</h2>
                        <p>Ya no hay preguntas pendientes.</p>

                        <button
                            className="btn btn-primary qr-btn-primary"
                            onClick={() => setMostrarConfirmacion(true)}
                            disabled={enviando}
                        >
                            Finalizar intento
                        </button>
                    </main>
                )}
            </main>

            {mostrarConfirmacion && (
                <article
                    className="qr-modal-overlay"
                    role="presentation"
                >
                    <article
                        className="qr-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="qr-modal-title"
                    >
                        <header className="qr-modal-header">
                            <i className="bi bi-send qr-modal-icon"></i>
                            <h2 id="qr-modal-title" className="qr-modal-title">
                                ¿Deseas enviar tus respuestas?
                            </h2>
                        </header>

                        <main className="qr-modal-body">
                            <p>
                                Una vez finalizado el intento no podrás modificar
                                tus respuestas.
                            </p>

                            <article className="qr-modal-actions">
                                <button
                                    className="btn btn-outline-secondary qr-btn-secondary"
                                    onClick={() => setMostrarConfirmacion(false)}
                                    disabled={enviando}
                                >
                                    Seguir contestando
                                </button>

                                <button
                                    className="btn btn-primary qr-btn-primary"
                                    onClick={confirmarEnvio}
                                    disabled={enviando}
                                >
                                    {enviando ? 'Enviando...' : 'Enviar'}
                                </button>
                            </article>
                        </main>
                    </article>
                </article>
            )}
        </article>
    );
}