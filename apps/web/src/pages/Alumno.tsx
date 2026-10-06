import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/ApiClient';
import '../styles/Alumno.css';
import { useSidebar } from '../context/SidebarContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface QuizAlumno {
  id: string;
  titulo: string;
  grupoCode: string;
  grupoNombre: string;
  preguntas: number;
  segundosPorPregunta: number;
  abre: number;   
  cierra: number;
}

const MIN = 60_000;



const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatFecha(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const h12 = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}, ${h12}:${min} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

function formatRestante(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MIN));
  const dias = Math.floor(totalMin / 1440);
  const horas = Math.floor((totalMin % 1440) / 60);
  const minutos = totalMin % 60;
  return dias > 0 ? `${dias} d ${horas} h` : `${horas} h ${minutos} min`;
}



function textoSaludo(activos: number): string {
  if (activos === 0) return 'No tienes quizzes activos por ahora.';
  if (activos === 1) return 'Tienes 1 quiz activo esperando.';
  return `Tienes ${activos} quizzes activos esperando.`;
}

export default function AlumnoInicio() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();

  const nombreAlumno =
    `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() ||
    user?.email ||
    'Alumno';

  const [ahora, setAhora] = useState(() => Date.now());
  const [quizzes, setQuizzes] = useState<QuizAlumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), MIN);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function cargarQuizzes() {
      try {
        const response = await apiClient.get<
          Array<{
            id: string;
            nombre: string;
            fechaInicio: string | null;
            fechaFinalizacion: string | null;
            grupoId: string | null;
          }>
        >('/api/quizzes');

        const datos: QuizAlumno[] = (response.data ?? []).map((quiz) => ({
          id: quiz.id,
          titulo: quiz.nombre,
          grupoCode: quiz.grupoId ?? '',
          grupoNombre: `Grupo ${quiz.grupoId ?? '-'}`,
          preguntas: 0,
          segundosPorPregunta: 0,
          abre: quiz.fechaInicio ? Date.parse(quiz.fechaInicio) : Date.now(),
          cierra: quiz.fechaFinalizacion
            ? Date.parse(quiz.fechaFinalizacion)
            : Date.now(),
        }));

        setQuizzes(datos);
      } catch {
        setError('No se pudieron cargar los quizzes.');
      } finally {
        setLoading(false);
      }
    }

    void cargarQuizzes();
  }, []);

  const vigentes = quizzes.filter((q) => q.cierra > ahora).map((q) => ({
    ...q,
    activo: q.abre <= ahora,
  }));

  const activos = vigentes.filter((q) => q.activo).sort((a, b) => a.cierra - b.cierra);
  const proximos = vigentes.filter((q) => !q.activo).sort((a, b) => a.abre - b.abre);
  const ordenados = useMemo(() => [...activos, ...proximos], [activos, proximos]);

  return (
    <article className="al-screen">
      <header className="al-topbar">
        <article className="al-topbar-side">
          <button className="al-icon-btn-plain" onClick={toggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
            <i className="bi bi-list al-icon"></i>
          </button>
          <span className="al-topbar-title">Alumno</span>
        </article>

      </header>

      <main className="al-content">
        <section className="al-intro">
          <h1 className="al-title">Inicio</h1>
          <p className="al-greeting">
            Hola, {nombreAlumno}. {textoSaludo(activos.length)}
          </p>
          <article className="al-counters">
            <span className="al-counter">Activos <strong>{activos.length}</strong></span>
            <span className="al-counter">Próximos <strong>{proximos.length}</strong></span>
          </article>
        </section>

        {loading && <p className="al-empty">Cargando quizzes...</p>}
        {error && <p className="al-empty">{error}</p>}

        {!loading && !error && (
          <article className="al-list">
            {ordenados.map((q) => (
              <article key={`${q.grupoCode}-${q.id}`} className={`al-card ${q.activo ? 'al-card-activo' : ''}`}>
                <article className="al-card-top">
                  <span className={`al-status ${q.activo ? 'al-status-activo' : 'al-status-proximo'}`}>
                    {q.activo && <i className="bi bi-circle-fill"></i>}
                    {q.activo ? 'ACTIVO' : 'PRÓXIMO'}
                  </span>
                  <button className="al-group-link" onClick={() => navigate(`/grupos/${q.grupoCode}`)}>
                    {q.grupoNombre} →
                  </button>
                </article>

                <h3 className="al-card-title">{q.titulo}</h3>

                <p className="al-card-meta">
                  {q.preguntas} preguntas · {q.segundosPorPregunta} s por pregunta ·{' '}
                  {q.activo
                    ? `Cierra en ${formatRestante(q.cierra - ahora)} · ${formatFecha(q.cierra)}`
                    : `Se habilita el ${formatFecha(q.abre)}`}
                </p>

                <button
                  className={`al-btn ${q.activo ? 'al-btn-primary' : ''}`}
                  disabled={!q.activo}
                  onClick={() => navigate(`/grupos/${q.grupoCode}/quizzes/${q.id}/resolver`)}
                >
                  {q.activo ? 'Iniciar quiz' : 'Aún no disponible'}
                </button>
              </article>
            ))}
          </article>
        )}
      </main>
    </article>
  );
}