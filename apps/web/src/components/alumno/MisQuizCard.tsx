const MIN = 60_000;

const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

import type { MisQuizCardProps } from '../../types/AlumnoTypes.ts';

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

export default function MisQuizCard({
  id,
  titulo,
  grupoCode,
  grupoNombre,
  preguntas,
  segundosPorPregunta,
  abre,
  cierra,
  activo,
  ahora,
  onOpenGroup,
  onStartQuiz,
}: MisQuizCardProps) {
  return (
    <article className={`al-card ${activo ? 'al-card-activo' : ''}`}>
      <article className="al-card-top">
        <span className={`al-status ${activo ? 'al-status-activo' : 'al-status-proximo'}`}>
          {activo && <i className="bi bi-circle-fill"></i>}
          {activo ? 'ACTIVO' : 'PRÓXIMO'}
        </span>
        <button type="button" className="al-group-link" onClick={() => onOpenGroup(grupoCode)}>
          {grupoNombre} →
        </button>
      </article>

      <h3 className="al-card-title">{titulo}</h3>

      <p className="al-card-meta">
        {preguntas} preguntas · {segundosPorPregunta} s por pregunta ·{' '}
        {activo
          ? `Cierra en ${formatRestante(cierra - ahora)} · ${formatFecha(cierra)}`
          : `Se habilita el ${formatFecha(abre)}`}
      </p>

      <button
        className={`al-btn ${activo ? 'al-btn-primary' : ''}`}
        disabled={!activo}
        onClick={() => onStartQuiz(grupoCode, id)}
      >
        {activo ? 'Iniciar quiz' : 'Aún no disponible'}
      </button>
    </article>
  );
}