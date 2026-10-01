import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { QuizData } from '../types/QuizTypes.ts';
import '../styles/QuizAlumno.css';

const MOCK_QUIZZES: Record<string, Record<string, QuizData>> = {
  'MAT3-A': {
    q4: {
      titulo: 'Quiz 4: Identidades Trigonométricas',
      inicio: '2026-09-01T00:00:00',
      fin: '2026-12-31T23:59:00',
      preguntas: [
        {
          id: 'p1',
          texto: '¿Cuál es la identidad recíproca de sen(x)?',
            opciones: [
            { id: 'a', texto: 'csc(x)' },
            { id: 'b', texto: 'sec(x)' },
            { id: 'c', texto: 'cot(x)' },
            { id: 'd', texto: 'tan(x)' },
          ],
        },
        {
          id: 'p2',
          texto: '¿Cuál es el valor de sen²(x) + cos²(x)?',
            opciones: [
            { id: 'a', texto: '0' },
            { id: 'b', texto: '1' },
            { id: 'c', texto: '2' },
            { id: 'd', texto: 'Depende de x' },
          ],
        },
        {
          id: 'p3',
          texto: '¿Cuál es la identidad recíproca de cos(x)?',
            opciones: [
            { id: 'a', texto: 'csc(x)' },
            { id: 'b', texto: 'sec(x)' },
            { id: 'c', texto: 'cot(x)' },
            { id: 'd', texto: 'sen(x)' },
          ],
        },
      ],
    },
  },
};

type Estado = 'no_disponible' | 'cerrado' | 'en_curso' | 'confirmado';

export default function QuizResolve(){
    const { code, quizId} = useParams<{code: string; quizId:string}>();
    const navigate =useNavigate();

    const quiz = code && quizId ? MOCK_QUIZZES[code]?.[quizId] : undefined;

    const [indice, setIndice] = useState(0);
    const [respuestas, SetRespuestas] = useState<Record<string,string>>({});
    const [mostrarNavegador, setmostrarNavegador] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);
    const [estado, setEstado] = useState<Estado>('en_curso');
    const [envioAutomatico, setEnvioAutomatico] = useState(false);

    useEffect(() => {
        if(!quiz) return;
        const ahora = Date.now();
        const inicio = new Date(quiz.inicio).getTime();
        const fin = new Date(quiz.fin).getTime();
        
        if (ahora < inicio){
            setEstado('no_disponible');
        } else if (ahora > fin){
            setEstado('cerrado');
        } else {
            setEstado('en_curso');
            setTiempoRestante(Math.floor((fin - ahora) /1000));
        }
    } ,[quiz]);

    useEffect(() =>{
        if (estado !== 'en_curso') return;
        if (tiempoRestante <= 0){
            setEnvioAutomatico(true);
            setEstado('confirmado');
            return;
        }
        const temporizador = setTimeout(() => setTiempoRestante((t) => t-1), 1000);
        return () => clearTimeout(temporizador);
        }, [estado,tiempoRestante]);

        const tiempoFormateado = useMemo(()=>{
            const hora = Math.floor(tiempoRestante / 3600);
            const minuto = Math.floor((tiempoRestante % 3600) / 60);
            const segundo = tiempoRestante %60;
            if (hora > 0) return `${hora}hora ${minuto}minuto`;
            return `${minuto}:${segundo.toString().padStart(2,'0')}`;
        }, [tiempoRestante]);

        if (!quiz){
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

        if( estado === 'no_disponible'){
            <article>
                <main>
                    <p>Este Quiz no está disponible</p>
                    <button onClick={() => navigate(`/grupos/${code}`)}>
                        Volver al grupo
                    </button>
                </main>
            </article>
        }

        if (estado === 'cerrado'){
            return (
                <article>
                    <main>
                        <p>Este quiz ya cerró</p>
                    </main>
                        <button onClick={() => navigate(`/grupos/${code}`)}>
                            Volver al grupo.
                        </button>
                </article>
            );
        }

        if (estado === 'confirmado'){
            const contestadas = Object.keys(respuestas).length;
            return (
                <article>
                    <main>
                        <i className="bi bi-check-circle-fill"></i>
                        <h1>
                            {envioAutomatico ? 'Tiempo agotado. Respuestas enviadas' : 'Quiz enviado'}
                        </h1>
                        <p>
                            Respondiste {contestadas} de {quiz.preguntas.length} preguntas.
                        </p>
                    </main>
                        <button onClick={() => navigate(`/grupos/${code}`)}>
                            Volver al grupo
                        </button>
                </article>
            );
        }

        const pregunta = quiz.preguntas[indice];
        const sinResponder = quiz.preguntas.length - Object.keys(respuestas).length;

        function seleccionar(opcionId: string){
            SetRespuestas((prev) => ({ ...prev, [pregunta.id]: opcionId}));
        }

        function irA(indice:number){
            setIndice(indice);
            setmostrarNavegador(false);
        }

        function confirmarEnvio(){
            setEnvioAutomatico(false);
            setMostrarConfirmacion(false);
            setEstado('confirmado');
        }

        return (
            <article>
                <header>
                    <span> {quiz.titulo}</span>
                    <span>
                        <i className=" bi bi-clock"></i>{tiempoFormateado}
                    </span>
                </header>

                <button onClick={() => setmostrarNavegador((v) => !v)}> 
                    Pregunta {indice +1} de {quiz.preguntas.length}
                    <i className={`bi ${mostrarNavegador ? 'bi-chevron-up' : 'bi-chevron-down'}`} ></i>
                </button>

                <article>
                    <aside className={`${mostrarNavegador ? 'abierto' : ''} `}>
                        {quiz.preguntas.map((p, i) => (
                            <button key={p.id} className={`${i === indice ? 'actual' : ''} ${respuestas[p.id] ? 'respondida' : '' }`}
                            onClick={() => irA(i)}> {i+1} </button>
                        ))}
                    </aside>

                    <main>
                        <article>
                            <p>{pregunta.texto}</p>

                            <article>{pregunta.opciones.map((alt) => (
                                <label key={alt.id} className={`${respuestas[pregunta.id] === alt.id ? 'seleccionada' : '' } `}>
                                    <input 
                                    type="radio" 
                                    name={`pregunta-${pregunta.id}`} 
                                    checked={respuestas[pregunta.id] === alt.id}
                                    onChange={() => seleccionar(alt.id)}
                                    />
                                    {alt.texto}
                                </label>
                            ))}
                            </article>
                        </article>

                        <article>
                            <button 
                            disabled={indice === 0}
                            onClick={() => setIndice((i) => i -1)}>
                                Anterior
                            </button>

                            {indice < quiz.preguntas.length - 1 ? (
                            <button onClick={() => setIndice((i) => i+1)}>
                                Siguiente
                            </button> 
                            ) : (
                                <button onClick={() => setMostrarConfirmacion(true)}>
                                    Finalizar
                                </button>
                            )}
                        </article>
                    </main>
                </article>

                {mostrarConfirmacion && (
                    <article>
                        <article>
                            <h2>¿Desea enviar sus respuestas?</h2>
                            <p>
                                {sinResponder > 0
                                ?`Tienes ${sinResponder} preguntas(s) sin responder. Una vez enviado no podrás modificar tus respuestas.`
                                : 'Respondiste todas las preguntas. Una vez enviado no podrás modificar tus respuestas'}
                            </p>

                            <article>
                                <button onClick={()=> setMostrarConfirmacion(false)}>
                                    Seguir contestando
                                </button>
                                <button onClick={confirmarEnvio}>
                                    Enviar
                                </button>
                            </article>
                        </article>
                    </article>
                )}
            </article>
        );
}