import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Option {
    id: string;
    texto: string;
}

interface Question{
    id: string;
    texto: string;
    opciones: Option[];
    respuestaCorrectaId: string |null;
}

let contId = 0;
function newId(prefijo: string):string{
    contId += 1;
    return `${prefijo}-${Date.now()}-${contId}`;
}

function EmptyQuestion(): Question{
    return{
        id: newId('preg'),
        texto: '',
        opciones: [
            {id: newId('op'), texto: ''},
            {id: newId('op'), texto: ''},
        ],
        respuestaCorrectaId:null,
    };
}

export default function QuizNuevo(){
    const {code} = useParams<{code:string}>();
    const navigate = useNavigate();
    const [titulo, setTitulo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [preguntas, setPreguntas] = useState<Question[]>([EmptyQuestion()]);
    const [error,setError] = useState <string | null>(null);

    function updateQuestion(id:string, texto:string){
        setPreguntas((prev) => prev.map((p) => (p.id === id ? { ...p,texto} :p)));
    }

    function addQuestion(){
        setPreguntas((prev => [...prev, EmptyQuestion()]));
    }

    function deleteQuestion(id:string){
        setPreguntas((prev) => prev.filter((p) => p.id !== id));
    }

    function updateOption(preguntaId:string, opcionId: string, texto:string){
        setPreguntas((prev) =>
            prev.map((p) =>
                p.id === preguntaId
                ? {...p,opciones:p.opciones.map((o) => (o.id ===opcionId ? { ...o,texto} : o))}: p
    ));
    }

    function addOption(preguntaId: string){
        setPreguntas((prev) =>
            prev.map((p) =>
                p.id === preguntaId ? { ...p, opciones: [...p.opciones, { id:newId('op'),texto: ''}]
                } :p
            ));
    }

    function deleteOption(preguntaId: string, opcionId:string){
        setPreguntas((prev) =>
            prev.map((p) =>{
                if (p.id !== preguntaId) return p;
                if (p.opciones.length <= 2) return p;
                const opciones = p.opciones.filter((o) => o.id !== opcionId);
                const respuestaCorrectaId = p.respuestaCorrectaId === opcionId ? null : p.respuestaCorrectaId;
                return { ...p, opciones,respuestaCorrectaId};
        })
    );
    }

    function markCorrect(preguntaId: string, opcionId: string){
        setPreguntas((prev)=>
        prev.map((p) => (p.id === preguntaId ? { ...p, respuestaCorrectaId:opcionId} : p))
    );
    }

    function validate():string | null{
        if (!titulo.trim()) return 'El quiz necesita un titulo.';
        if (!fechaFin || !fechaInicio)return ' Defina la fecha/hora de inicio y de cierre.'
        if(new Date(fechaFin) <= new Date(fechaInicio)) return 'La fecha de cierre debe ser posterior a la de inicio.';
        if(preguntas.length === 0) return 'Agregue al menos una pregunta.';

        for (let i = 0; i < preguntas.length; i++){
            const p =preguntas[i];
            if (!p.texto.trim()) return `La pregunta ${i + 1} no tiene texto.`;
            if (p.opciones.some((o) => !o.texto.trim())) return `Todas las opciones de la pregunta ${i + 1} deben tener texto.`;
            if (!p.respuestaCorrectaId) return `marca la respuesta correcta de la pregunta ${ i + 1}.`;
        }
        return null;


    }

    function handleSubmit(){
        const mensaje = validate();
        if (mensaje){
            setError(mensaje);
            return;
        }
        setError(null);

            console.log('Quiz creado (mock):', { code, titulo, fechaInicio, fechaFin, preguntas });
    navigate (`/grupos/${code}`);
    }


    

return (
    <article>
      <header>
        <article>
          <i className="bi bi-list"></i>
          <span>Docente</span>
        </article>
      </header>

      <nav>
        <span>Inicio</span>
        <span>/</span>
        <span onClick={() => navigate('/grupos')} style={{ cursor: 'pointer' }}>Grupos</span>
        <span>/</span>
        <span onClick={() => navigate(`/grupos/${code}`)} style={{ cursor: 'pointer' }}>{code}</span>
        <span>/</span>
        <span>Nuevo Quiz</span>
      </nav>

      <main>
        <h1>Crear nuevo quiz</h1>

        <article>
          <label>
            <span>Título del quiz</span>
            <input
              type="text"
              placeholder="Ej. Quiz 4: Identidades Trigonométricas"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>

          <article>
            <label>
              <span>Fecha y hora de inicio</span>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </label>
            <label>
              <span>Fecha y hora de cierre</span>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </label>
          </article>
        </article>

        <h2>Preguntas ({preguntas.length})</h2>

        {preguntas.map((pregunta, index) => (
          <article key={pregunta.id}>
            <article>
              <span>Pregunta {index + 1}</span>
              {
                <button
                  type="button"
                  onClick={() => deleteQuestion(pregunta.id)}
                >
                  <i className="bi bi-trash"></i> Eliminar pregunta
                </button>
              }
            </article>

            <input
              type="text"
              placeholder="Escriba la pregunta..."
              value={pregunta.texto}
              onChange={(e) => updateQuestion(pregunta.id, e.target.value)}
            />

            <article>
              {pregunta.opciones.map((opcion, opIndex) => (
                <article key={opcion.id}>
                  <input
                    type="radio"
                    name={`correcta-${pregunta.id}`}
                    checked={pregunta.respuestaCorrectaId === opcion.id}
                    onChange={() => markCorrect(pregunta.id, opcion.id)}
                    title="Marcar como respuesta correcta"
                  />
                  <input
                    type="text"
                    placeholder={`Opción ${opIndex + 1}`}
                    value={opcion.texto}
                    onChange={(e) => updateOption(pregunta.id, opcion.id, e.target.value)}
                  />
                  {pregunta.opciones.length > 2 && (
                    <i
                      className="bi bi-x-lg"
                      onClick={() => deleteOption(pregunta.id, opcion.id)}
                    ></i>
                  )}
                </article>
              ))}
            </article>

            <button type="button" onClick={() => addOption(pregunta.id)}>
              <i className="bi bi-plus-lg"></i> Agregar opción
            </button>
          </article>
        ))}

        <button type="button" onClick={addQuestion}>
          <i className="bi bi-plus-lg"></i> Agregar pregunta
        </button>

        {error && <p>{error}</p>}

        <article>
          <button type="button"  onClick={() => navigate(`/grupos/${code}`)}>
            Cancelar
          </button>
          <button type="button"  onClick={handleSubmit}>
            Guardar Quiz
          </button>
        </article>
      </main>
    </article>
  );
}