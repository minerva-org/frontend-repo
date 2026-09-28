import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Alumno.css';
import AlumnoNav from '../components/AlumnosNav.tsx';

interface QuizAlumno {
  id: string;
  titulo: string;
  grupoCode: string;
  grupoNombre: string;
  preguntas: number;
  segundosPorPregunta: number;
  abre: number; // timestamp en ms
  cierra: number; // timestamp en ms
}

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const BASE = Date.now();

// TODO: reemplazar por los datos reales del alumno
const NOMBRE_ALUMNO = 'Carlos';

const MOCK_QUIZZES: QuizAlumno[] = [
  { id: 'q3', titulo: 'Quiz 3: Cinemática', grupoCode: 'FIS2-B', grupoNombre: 'Física II · 2.° B', preguntas: 3, segundosPorPregunta: 40, abre: BASE - HORA, cierra: BASE + 5 * HORA },
  { id: 'q5', titulo: 'Quiz 5: Identidades Recíprocas', grupoCode: 'MAT3-A', grupoNombre: 'Matemáticas III · 3.° A', preguntas: 4, segundosPorPregunta: 45, abre: BASE - 2 * HORA, cierra: BASE + DIA + 22 * HORA },
  { id: 'q4', titulo: 'Quiz 4: Leyes de Newton', grupoCode: 'FIS2-B', grupoNombre: 'Física II · 2.° B', preguntas: 3, segundosPorPregunta: 40, abre: BASE + DIA, cierra: BASE + 2 * DIA },
  { id: 'q6', titulo: 'Quiz 6: Geometría Analítica', grupoCode: 'MAT3-A', grupoNombre: 'Matemáticas III · 3.° A', preguntas: 3, segundosPorPregunta: 45, abre: BASE + 3 * DIA, cierra: BASE + 4 * DIA },
  { id: 'q2', titulo: 'Quiz 2: Ciclos', grupoCode: 'PROG1-A', grupoNombre: 'Programación I · 1.° A', preguntas: 3, segundosPorPregunta: 50, abre: BASE + 5 * DIA, cierra: BASE + 6 * DIA },
];

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
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return d > 0 ? `${d} d ${h} h` : `${h} h ${m} min`;
}

function textoSaludo(activos: number): string {
  if (activos === 0) return 'No tienes quizzes activos por ahora.';
  if (activos === 1) return 'Tienes 1 quiz activo esperando.';
  return `Tienes ${activos} quizzes activos esperando.`;
}

export default function AlumnoInicio() {
  const navigate = useNavigate();
  const [ahora, setAhora] = useState(() => Date.now());

  // Refresca los contadores cada minuto
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), MIN);
    return () => clearInterval(id);
  }, []);

  const vigentes = MOCK_QUIZZES.filter((q) => q.cierra > ahora).map((q) => ({
    ...q,
    activo: q.abre <= ahora,
  }));

  const activos = vigentes.filter((q) => q.activo).sort((a, b) => a.cierra - b.cierra);
  const proximos = vigentes.filter((q) => !q.activo).sort((a, b) => a.abre - b.abre);
  const ordenados = [...activos, ...proximos];

  return (
    <div className="al-screen">
      <header className="al-topbar">
        <div className="al-topbar-side">
          <i className="bi bi-list al-icon"></i>
          <span className="al-topbar-title">Alumno</span>
        </div>
        <div className="al-topbar-side">
          <i className="bi bi-bell al-icon"></i>
          <i className="bi bi-person-circle al-icon"></i>
        </div>
      </header>
      <AlumnoNav />

      <main className="al-content">
        <section className="al-intro">
          <h1 className="al-title">Inicio</h1>
          <p className="al-greeting">
            Hola, {NOMBRE_ALUMNO}. {textoSaludo(activos.length)}
          </p>
          <div className="al-counters">
            <span className="al-counter">Activos <strong>{activos.length}</strong></span>
            <span className="al-counter">Próximos <strong>{proximos.length}</strong></span>
          </div>
        </section>

        <h2 className="al-section-label">TUS QUIZZES MÁS CERCANOS</h2>

        {ordenados.length === 0 && <p className="al-empty">No tienes quizzes pendientes.</p>}

        <div className="al-list">
          {ordenados.map((q) => (
            <article key={`${q.grupoCode}-${q.id}`} className={`al-card ${q.activo ? 'al-card-activo' : ''}`}>
              <div className="al-card-top">
                <span className={`al-status ${q.activo ? 'al-status-activo' : 'al-status-proximo'}`}>
                  {q.activo && <i className="bi bi-circle-fill"></i>}
                  {q.activo ? 'ACTIVO' : 'PRÓXIMO'}
                </span>
                <button className="al-group-link" onClick={() => navigate(`/grupos/${q.grupoCode}`)}>
                  {q.grupoNombre} →
                </button>
              </div>

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
        </div>
      </main>
    </div>
  );
}