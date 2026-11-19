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
  PuedeManejar: boolean;
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

export default function QuizCatalogCard({ quiz, expanded, onToggleExpand, onEdit, onDelete, PuedeManejar}: QuizCatalogCardProps) {
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
    <article className={`d-flex flex-column  gap-3 p-3 rounded-3  border ${estado === 'pasado' ? 
                        'bg-body-secondary' : 'bg-white'}`}>

      <article className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <article className="d-flex flex-column gap-1 min-w-0">
          <span className="fw-bold text-break">{quiz.nombre}</span>
          <span className="text-secondary">
            {quiz.fechaCreacion ? `Creado: ${formatDate(quiz.fechaCreacion)}` : ''}
          </span>
        </article>

        <article className="d-flex flex-row flex-sm-column align-items-center align-items-sm-end gap-2 flex-shrink-0">
          <span className={`badge rounded-pill ${estado === 'activo' ?
                          'bg-success-subtle text-success-emphasis' : estado === 'pasado' ?
                          'bg-secondary-subtle text-secondary-emphasis' : 'bg-warning-subtle text-warning-emphasis'}`}>
                            {estadoLabel}
          </span>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => onToggleExpand(quiz.id)}>
            {expanded ? 'Ocultar' : 'Ver preguntas'}
          </button>
        </article>
      </article>

        {/* Fechas */}
      <article className="row row-cols-1 row-cols-sm-2 g-2 small text-secondary">
        <span className='col'><strong className='text-body'>Inicio:</strong> {fechaInicio}</span>
        <span className='col'><strong className='text-body'>Cierre:</strong> {fechaFin}</span>
      </article>
        
      {/* Preguntas */}
      {expanded && (
        <article className="p-3 rounded-3 border bg-body-tertiary">
          {loadingPreguntas ? (
            <p className="text-secondary small mb-0">Cargando preguntas...</p>
          ) : preguntas.length === 0 ? (
            <p className="text-secondary small mb-0">Este quiz aún no tiene preguntas asociadas.</p>
          ) : (
            <ul className="d-flex flex-column gap-2 small mb-0 ps-3">
              {preguntas.map((pregunta, index) => (
                <li key={pregunta.id} className="ps-1">
                  <span className="fw-bold me-1">{index + 1}.</span>
                  <span>{pregunta.descripcion ?? pregunta.enunciado ?? 'Pregunta sin texto'}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      {PuedeManejar && (
        <article className="d-flex flex-wrap gap-2 pt-1 border-top">
          <button className="btn btn-primary btn-sm" type="button" onClick={() => onEdit(quiz.id)}>
            <i className="bi bi-pencil me-1"></i> Editar
          </button>
          <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(quiz.id, quiz.nombre)}>
            <i className="bi bi-trash me-1"></i> Borrar
          </button>
        </article>
      )}
    </article>
  );
}
