import { useEffect, useState } from 'react';
import { apiClient } from '../../services/ApiClient';
import type { QuizCatalogCardData, QuizCatalogState, QuizPreguntaPreview } from '../../types/QuizTypes.ts';

export type { QuizCatalogCardData, QuizCatalogState } from '../../types/QuizTypes.ts';

interface QuizCatalogCardProps {
  quiz: QuizCatalogCardData;
  expanded: boolean;
  onToggleExpand: (quizId: string) => void;
  onEdit: (quizId: string) => void;
  onDelete: (quizId: string, nombre: string) => void;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getQuizCatalogState(quiz: QuizCatalogCardData, now = new Date()): QuizCatalogState {
  const actual = now.getTime();
  const fechaInicio = parseDate(quiz.fechaInicio)?.getTime();
  const fechaFinalizacion = parseDate(quiz.fechaFinalizacion)?.getTime();

  if (fechaInicio && actual < fechaInicio) return 'proximo';
  if (fechaInicio && fechaFinalizacion && actual >= fechaInicio && actual < fechaFinalizacion) return 'activo';
  if (fechaFinalizacion && actual >= fechaFinalizacion) return 'pasado';
  return 'proximo';
}

async function fetchQuizQuestions(quizId: string): Promise<QuizPreguntaPreview[]> {
  const endpoints = [
    `/api/quizzes/${quizId}/preguntas`,
    `/api/quiz-x-pregunta?quizId=${encodeURIComponent(quizId)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get<Array<Record<string, unknown>>>(endpoint);
      const rows = response.data ?? [];

      if (!Array.isArray(rows) || rows.length === 0) {
        return [];
      }

      const hasDescripcion = typeof rows[0]?.descripcion === 'string' || typeof rows[0]?.enunciado === 'string';
      if (hasDescripcion) {
        return rows.map((row) => ({
          id: String(row.id ?? crypto.randomUUID()),
          descripcion: typeof row.descripcion === 'string' ? row.descripcion : typeof row.enunciado === 'string' ? row.enunciado : undefined,
          enunciado: typeof row.enunciado === 'string' ? row.enunciado : undefined,
        }));
      }

      const preguntaIds = rows
        .map((row) => (typeof row.preguntaId === 'string' ? row.preguntaId : typeof row.pregunta_id === 'string' ? row.pregunta_id : null))
        .filter((value): value is string => Boolean(value));

      if (preguntaIds.length === 0) {
        continue;
      }

      const preguntas = await Promise.all(
        preguntaIds.map(async (preguntaId) => {
          try {
            const preguntaResponse = await apiClient.get<Record<string, unknown>>(`/api/preguntas/${preguntaId}`);
            const pregunta = preguntaResponse.data ?? {};
            const descripcion = typeof pregunta.descripcion === 'string' ? pregunta.descripcion : typeof pregunta.enunciado === 'string' ? pregunta.enunciado : 'Pregunta sin texto';
            return { id: String(preguntaId), descripcion, enunciado: descripcion };
          } catch {
            return { id: preguntaId, descripcion: 'Pregunta sin texto', enunciado: 'Pregunta sin texto' };
          }
        }),
      );

      return preguntas;
    } catch {
      // intenta con el siguiente endpoint si falla
    }
  }

  return [];
}

export default function QuizCatalogCard({ quiz, expanded, onToggleExpand, onEdit, onDelete }: QuizCatalogCardProps) {
  const [preguntas, setPreguntas] = useState<QuizPreguntaPreview[]>([]);
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!expanded || loaded) return;

    let cancelled = false;

    async function loadPreguntas() {
      setLoadingPreguntas(true);
      try {
        const nextPreguntas = await fetchQuizQuestions(quiz.id);
        if (!cancelled) {
          setPreguntas(nextPreguntas);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setPreguntas([]);
          setLoaded(true);
        }
      } finally {
        if (!cancelled) setLoadingPreguntas(false);
      }
    }

    void loadPreguntas();

    return () => {
      cancelled = true;
    };
  }, [expanded, loaded, quiz.id]);

  const estado = getQuizCatalogState(quiz);
  const estadoLabel = {
    proximo: 'Próximo',
    activo: 'Activo',
    pasado: 'Finalizado',
  }[estado];

  const fechaInicio = formatDate(quiz.fechaInicio);
  const fechaFin = formatDate(quiz.fechaFinalizacion);

  return (
    <article className={`gd-quiz ${estado === 'pasado' ? 'gd-quiz-past' : ''}`}>
      <article className="gd-quiz-row">
        <article className="gd-quiz-info">
          <span className="gd-quiz-title">{quiz.nombre}</span>
          <span className="gd-quiz-meta">
            {quiz.fechaCreacion ? `Creado: ${formatDate(quiz.fechaCreacion)} · ` : ''}
            {preguntas.length > 0 ? `${preguntas.length} preguntas` : 'Sin preguntas cargadas'}
          </span>
        </article>

        <article className="gd-quiz-side">
          <span className={`gd-badge ${estado === 'activo' ? 'gd-badge-ok' : 'gd-badge-fecha'}`}>{estadoLabel}</span>
          <button type="button" className="gd-btn gd-btn-small" onClick={() => onToggleExpand(quiz.id)}>
            {expanded ? 'Ocultar' : 'Ver preguntas'}
          </button>
        </article>
      </article>

      <article className="gd-quiz-meta-grid">
        <span><strong>Inicio:</strong> {fechaInicio}</span>
        <span><strong>Cierre:</strong> {fechaFin}</span>
      </article>

      {expanded && (
        <article className="gd-quiz-details">
          {loadingPreguntas ? (
            <p className="gd-quiz-empty">Cargando preguntas...</p>
          ) : preguntas.length === 0 ? (
            <p className="gd-quiz-empty">Este quiz aún no tiene preguntas asociadas.</p>
          ) : (
            <ul className="gd-quiz-question-list">
              {preguntas.map((pregunta, index) => (
                <li key={pregunta.id} className="gd-quiz-question-item">
                  <span className="gd-quiz-question-number">{index + 1}.</span>
                  <span>{pregunta.descripcion ?? pregunta.enunciado ?? 'Pregunta sin texto'}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      <article className="gd-quiz-actions">
        <button className="gd-btn" type="button" onClick={() => onEdit(quiz.id)}>
          <i className="bi bi-pencil"></i> Editar
        </button>
        <button className="gd-btn gd-btn-danger" type="button" onClick={() => onDelete(quiz.id, quiz.nombre)}>
          <i className="bi bi-trash"></i> Borrar
        </button>
      </article>
    </article>
  );
}
