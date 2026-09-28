import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import ModalAgregarAlumnos from '../components/ModalAlumnos.tsx';



interface QuizItemAlumno {
  id: string;
  titulo: string;
  preguntas: number;
  estado: 'disponible' | 'no_disponible';
  meta: string;
}

interface DetalleAlumnoData {
  idVisible: string;
  titulo: string;
  materia: string;
  grado: string;
  docente: string;
  ciclo: string;
  proximos: QuizItemAlumno[];
  pasados: QuizItemAlumno[];
}

const MOCK_DETALLE_ALUMNO: Record<string, DetalleAlumnoData> = {
  'MAT3-A': {
    idVisible: 'GRP-2026-MAT3A',
    titulo: 'Matemáticas III — 3.° A',
    materia: 'Matemáticas',
    grado: '3.° Bachillerato',
    docente: 'Prof. García',
    ciclo: 'Ago 2026 – Ene 2027',
    proximos: [
      { id: 'q4', titulo: 'Quiz 4: Identidades Trigonométricas', preguntas: 5, estado: 'disponible', meta: 'Disponible ahora · Cierra 14 Sep 2026, 11:59 PM' },
    ],
    pasados: [
      { id: 'q3', titulo: 'Quiz 3: Teorema de Pitágoras', preguntas: 5, estado: 'no_disponible', meta: '34 / 36 respondieron' },
    ],
  },
};

interface AlumnoEntry {
  id: string;
  nombre: string;
  estado: 'pendiente' | 'normal';
  calificacion?: number;
}

interface QuizItemDocente {
  id: string;
  titulo: string;
  meta: string;
  etiquetaDerecha: string;
}

interface DetalleDocenteData {
  idVisible: string;
  titulo: string;
  grado: string;
  materia: string;
  codigoInscripcion: string;
  ciclo: string;
  quizzesProximos: QuizItemDocente[];
  quizzesPasados: QuizItemDocente[];
  alumnos: AlumnoEntry[];
}

const MOCK_DETALLE_DOCENTE: Record<string, DetalleDocenteData> = {
  'MAT3-A': {
    idVisible: 'GRP-2026-MAT3A',
    titulo: 'Matemáticas III — 3.° A',
    grado: '3.° Bachillerato',
    materia: 'Matemáticas',
    codigoInscripcion: 'MAT3A-26B',
    ciclo: 'Ago 2026 – Ene 2027',
    quizzesProximos: [
      { id: 'q4', titulo: 'Quiz 4: Identidades Trigonométricas', meta: '5 Preguntas · Conceptos: Seno recíproco, Identidad fundamental', etiquetaDerecha: '14 Sep 2026' },
    ],
    quizzesPasados: [
      { id: 'q3', titulo: 'Quiz 3: Teorema de Pitágoras', meta: '', etiquetaDerecha: '34 / 36 Respondieron' },
    ],
    alumnos: [
      { id: 's0', nombre: 'Mariana López', estado: 'pendiente' },
      { id: 's1', nombre: 'Alejandro Vega', estado: 'normal', calificacion: 94 },
      { id: 's2', nombre: 'Carlos Méndez', estado: 'normal', calificacion: 52 },
      { id: 's3', nombre: 'Sofía Valenzuela', estado: 'normal', calificacion: 68 },
    ],
  },
};

function claseCalificacion(cal: number): string {
  if (cal >= 80) return 'puntuacionALta';
  if (cal >= 60) return 'puntuacionMedia';
  return 'puntuacionBaja';
}

function obtenerTitulo(isStudent: boolean, code: string): string {
  const data = isStudent ? MOCK_DETALLE_ALUMNO[code] : MOCK_DETALLE_DOCENTE[code];
  return data?.titulo ?? code;
}


function VistaAlumno({ code }: { code: string }) {
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos');
  const data = MOCK_DETALLE_ALUMNO[code];
  const navigate =useNavigate();

  if (!data) return <p>Grupo no encontrado.</p>;

  const quizzes = tab === 'proximos' ? data.proximos : data.pasados;

  return (
    <>
      <article>
        <span>ID: {data.idVisible}</span>
        <article>
          <h1>{data.titulo}</h1>
          <span>Ciclo: {data.ciclo}</span>
        </article>
      </article>

      <article>
        <span><strong>Docente:</strong> {data.docente}</span>
        <span><strong>Materia:</strong> {data.materia}</span>
        <span><strong>Grado:</strong> {data.grado}</span>
      </article>

      <article>
        <article>
          <span>
            <i className="bi bi-journal-text"></i> Mis Quizzes
          </span>
          <article>
            <button className={`${tab === 'proximos' ? 'active' : ''}`} onClick={() => setTab('proximos')}>
              Próximos
            </button>
            <button className={`${tab === 'pasados' ? 'active' : ''}`} onClick={() => setTab('pasados')}>
              Pasados
            </button>
          </article>
        </article>

        {quizzes.length === 0 && <p>No hay quizzes en esta sección.</p>}

        {quizzes.map((quiz) => (
          <article key={quiz.id}>
            <article>
              <span>{quiz.titulo}</span>
              <span>{quiz.preguntas} preguntas · {quiz.meta}</span>
            </article>
            <article>
              <span className={`${quiz.estado}`}>
                {quiz.estado === 'disponible' ? 'Disponible' : 'Cerrado'}
              </span>
              <button disabled={quiz.estado !== 'disponible'}
              onClick={() => navigate(`/grupos/${code}/quizzes/${quiz.id}/resolver`)}>
                Contestar
              </button>
            </article>
          </article>
        ))}
      </article>
    </>
  );
}


function VistaDocente({ code }: { code: string }) {
  const [tab, setTab] = useState<'general' | 'settings'>('general');
  const [copiado, setCopiado] = useState(false);
  const [modalAgregarAlumnos, setModalAgregarAlumnos] = useState(false);
  const inicial = MOCK_DETALLE_DOCENTE[code];
  const [alumnos, setAlumnos] = useState<AlumnoEntry[]>(inicial?.alumnos ?? []);
  const navigate =useNavigate();

  if (!inicial) return <p>Grupo no encontrado.</p>;

  function handleAprove(id: string) {
    setAlumnos((prev) => prev.map((a) => (a.id === id ? { ...a, estado: 'normal' as const } : a)));
  }

  function handleReject(id: string) {
    setAlumnos((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCopiarCodigo() {
    navigator.clipboard?.writeText(inicial.codigoInscripcion).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  function handleSendInvitations(correos: string[]){
    const nuevos = correos.map((correos, i) =>({
      id:`invitado-${Date.now()}-${i}`,
      nombre:correos,
      estado: 'pendiente' as const,
    }));
    setAlumnos((prev) => [...nuevos, ...prev]);
  }

  return (
    <>
    {modalAgregarAlumnos && (
      <ModalAgregarAlumnos 
      onClose={() => setModalAgregarAlumnos(false)}
      onEnviar={handleSendInvitations}
      />
    )}
      <article>
        <span>ID: {inicial.idVisible}</span>
        <article>
          <h1>{inicial.titulo}</h1>
          <span>Ciclo: {inicial.ciclo}</span>
        </article>
      </article>

      <article>
        <article>
          <span><strong>Grado:</strong> {inicial.grado}</span>
          <span><strong>Materia:</strong> {inicial.materia}</span>
          <span>
            <strong>Código:</strong>
            <span>
              {inicial.codigoInscripcion}
              <i
                className={`bi ${copiado ? 'bi-check-lg' : 'bi-clipboard'}`}
                onClick={handleCopiarCodigo}
                title="Copiar código"
              ></i>
            </span>
          </span>
        </article>

        <article>
          <button className={`${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>
            <i className="bi bi-card-list"></i> General
          </button>
          <button className={`${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <i className="bi bi-gear"></i> Settings de Grupo y Examen
          </button>
        </article>
      </article>

      {tab === 'settings' ? (
        <article>
          <p>Settings de grupo y examen — en construcción.</p>
        </article>
      ) : (
        <article>
          <article>
            <article>
              <span>
                <i className="bi bi-journal-text"></i> Gestión de Quizzes
              </span>
              <button onClick={() => navigate(`/grupos/${code}/quizzes/nuevo`)}>
                <i className="bi bi-plus-lg"></i> Nuevo Quiz
              </button>
            </article>

            <p>PRÓXIMOS</p>
            {inicial.quizzesProximos.map((q) => (
              <article key={q.id}>
                <article>
                  <span>{q.titulo}</span>
                  <span>{q.meta}</span>
                </article>
                <span>{q.etiquetaDerecha}</span>
              </article>
            ))}

            <p>PASADOS</p>
            {inicial.quizzesPasados.map((q) => (
              <article key={q.id}>
                <article>
                  <span>{q.titulo}</span>
                </article>
                <span>{q.etiquetaDerecha}</span>
              </article>
            ))}
          </article>

          <article>
            <article>
              <span>
                <i className="bi bi-people"></i> Lista de Alumnos ({alumnos.length})
              </span>
              <button onClick={() => setModalAgregarAlumnos(true)}>
                <i className="bi bi-plus-lg"></i> Agregar
              </button>
            </article>

            {alumnos.map((a) =>
              a.estado === 'pendiente' ? (
                <article key={a.id}>
                  <span>{a.nombre} <em>(Solicitud)</em></span>
                  <article>
                    <button onClick={() => handleAprove(a.id)}>
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button onClick={() => handleReject(a.id)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </article>
                </article>
              ) : (
                <article key={a.id}>
                  <span>{a.nombre}</span>
                  {typeof a.calificacion === 'number' && (
                    <span className={`${claseCalificacion(a.calificacion)}`}>{a.calificacion}%</span>
                  )}
                </article>
              )
            )}
            {alumnos.length === 0 && <p>Sin alumnos inscritos.</p>}
          </article>
        </article>
      )}
    </>
  );
}


export default function GroupDetail() {
  const { role } = useAuth();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isStudent = role === 'alumno';

  if (!code) {
    return <p>Código de grupo no especificado.</p>;
  }

  const titulo = obtenerTitulo(isStudent, code);

  return (
    <article>
      <header>
        <article>
          <i className="bi bi-list"></i>
          <span>{isStudent ? 'Alumno' : 'Docente'}</span>
        </article>
        <article>
          <i className="bi bi-bell"></i>
          <i className="bi bi-person-circle"></i>
        </article>
      </header>

      <nav>
        <span>Inicio</span>
        <span>/</span>
        <span onClick={() => navigate(isStudent ? '/alumno' : '/grupos')} style={{ cursor: 'pointer' }}>
          {isStudent ? 'Mis Grupos' : 'Grupos'}
        </span>
        <span>/</span>
        <span>{titulo}</span>
      </nav>

      <main>
        {isStudent ? <VistaAlumno code={code} /> : <VistaDocente code={code} />}
      </main>
    </article>
  );
}