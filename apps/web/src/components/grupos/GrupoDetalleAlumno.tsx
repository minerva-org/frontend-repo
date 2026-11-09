import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/ApiClient';

interface GrupoDetalleBackend {
  id: string;
  claveGrupo: string;
  nombre: string;
  semestre: string;
  activo: boolean;
  docenteId: string | null;
  plantelId: number | null;
  materiaId: string | null;
  alumnosIds: string[];
}

interface QuizBackend {
  id: string;
  nombre: string;
  fechaCreacion: string | null;
  fechaInicio: string | null;
  fechaFinalizacion: string | null;
  grupoId: string | null;
}

type QuizEstado = 'activo' | 'proximo' | 'pasado';
type QuizTab = 'activos' | 'proximos' | 'pasados';

interface QuizAlumnoDetalle extends QuizBackend {
  estado: QuizEstado;
}

function getQuizEstado(quiz: QuizBackend): QuizEstado {
  const ahora = Date.now();

  const inicio = quiz.fechaInicio
    ? new Date(quiz.fechaInicio).getTime()
    : 0;

  const fin = quiz.fechaFinalizacion
    ? new Date(quiz.fechaFinalizacion).getTime()
    : 0;

  if (inicio > ahora) {
    return 'proximo';
  }

  if (fin && fin < ahora) {
    return 'pasado';
  }

  return 'activo';
}

function formatDate(value?: string | null): string {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function GrupoDetalleAlumno({
  code,
}: {
  code: string;
}) {
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<GrupoDetalleBackend | null>(null);
  const [quizzes, setQuizzes] = useState<QuizBackend[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quizTab, setQuizTab] =
    useState<QuizTab>('activos');

  useEffect(() => {
    let cancelled = false;

    async function cargarDetalle() {
      try {
        setLoading(true);
        setError(null);

        const [grupoResponse, quizzesResponse] =
          await Promise.all([
            apiClient.get<GrupoDetalleBackend>(
              `/api/grupos/${code}`,
            ),
            apiClient.get<QuizBackend[]>(
              '/api/quizzes',
            ),
          ]);

        if (cancelled) return;

        const grupoData = grupoResponse.data;

        setGrupo(grupoData);

        const quizzesDelGrupo = (
          quizzesResponse.data ?? []
        ).filter(
          (quiz) =>
            quiz.grupoId === grupoData.id ||
            quiz.grupoId === code,
        );

        setQuizzes(quizzesDelGrupo);
      } catch (error) {
        console.error(
          'Error cargando detalle del grupo:',
          error,
        );

        if (!cancelled) {
          setError(
            'No se pudo cargar la información del grupo.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void cargarDetalle();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const quizCatalog = useMemo<QuizAlumnoDetalle[]>(() => {
    return quizzes
      .map((quiz) => ({
        ...quiz,
        estado: getQuizEstado(quiz),
      }))
      .sort((a, b) => {
        const fechaA = a.fechaInicio
          ? new Date(a.fechaInicio).getTime()
          : 0;

        const fechaB = b.fechaInicio
          ? new Date(b.fechaInicio).getTime()
          : 0;

        return fechaB - fechaA;
      });
  }, [quizzes]);

  const quizGroups = useMemo(() => {
    return {
      activos: quizCatalog.filter(
        (quiz) => quiz.estado === 'activo',
      ),

      proximos: quizCatalog.filter(
        (quiz) => quiz.estado === 'proximo',
      ),

      pasados: quizCatalog.filter(
        (quiz) => quiz.estado === 'pasado',
      ),
    };
  }, [quizCatalog]);

  const quizVisible = quizGroups[quizTab];

  if (loading) {
    return (
      <p className="gd-empty">
        Cargando información del grupo...
      </p>
    );
  }

  if (error || !grupo) {
    return (
      <p className="gd-empty">
        {error ?? 'No se encontró el grupo.'}
      </p>
    );
  }

  return (
    <>
      <section className="gd-hero">

        <article className="gd-hero-row">
          <h1 className="gd-hero-title">
            {grupo.nombre}
          </h1>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">

          <span className="gd-meta-item">
            <strong className="gd-meta-label">
              Semestre:
            </strong>{' '}
            {grupo.semestre}
          </span>

          <span className="gd-meta-item">
            <strong className="gd-meta-label">
              Estado:
            </strong>{' '}
            {grupo.activo ? 'Activo' : 'Inactivo'}
          </span>
        </article>
      </section>

      <section className="gd-card">
        <article className="gd-card-header">
          <span className="gd-card-title">
            <i className="bi bi-journal-text"></i>{' '}
            Quizzes
          </span>
        </article>

        <article className="gd-quiz-actions">
          <button
            type="button"
            className={`gd-quiz-tab ${
              quizTab === 'activos' ? 'active' : ''
            }`}
            onClick={() => setQuizTab('activos')}
          >
            Activos ({quizGroups.activos.length})
          </button>

          <button
            type="button"
            className={`gd-quiz-tab ${
              quizTab === 'proximos' ? 'active' : ''
            }`}
            onClick={() => setQuizTab('proximos')}
          >
            Próximos ({quizGroups.proximos.length})
          </button>

          <button
            type="button"
            className={`gd-quiz-tab ${
              quizTab === 'pasados' ? 'active' : ''
            }`}
            onClick={() => setQuizTab('pasados')}
          >
            Pasados ({quizGroups.pasados.length})
          </button>
        </article>

        {quizVisible.length === 0 ? (
          <p className="gd-empty">
            {quizTab === 'activos'
              ? 'No hay quizzes activos para este grupo.'
              : quizTab === 'proximos'
                ? 'No hay quizzes próximos para este grupo.'
                : 'No hay quizzes pasados para este grupo.'}
          </p>
        ) : (
          <article className="gd-quiz-list">
            {quizVisible.map((quiz) => (
              <article
                key={quiz.id}
                className={`gd-quiz ${
                  quiz.estado === 'pasado'
                    ? 'gd-quiz-past'
                    : ''
                }`}
              >
                <article className="gd-quiz-row">
                  <article className="gd-quiz-info">
                    <span className="gd-quiz-title">
                      {quiz.nombre}
                    </span>

                    <span className="gd-quiz-meta">
                      {quiz.estado === 'activo'
                        ? `Finaliza: ${formatDate(
                            quiz.fechaFinalizacion,
                          )}`
                        : quiz.estado === 'proximo'
                          ? `Inicia: ${formatDate(
                              quiz.fechaInicio,
                            )}`
                          : `Finalizó: ${formatDate(
                              quiz.fechaFinalizacion,
                            )}`}
                    </span>
                  </article>

                  <article className="gd-quiz-side">
                    <span
                      className={`gd-badge ${
                        quiz.estado === 'activo'
                          ? 'gd-badge-ok'
                          : 'gd-badge-fecha'
                      }`}
                    >
                      {quiz.estado === 'activo'
                        ? 'Activo'
                        : quiz.estado === 'proximo'
                          ? 'Próximo'
                          : 'Finalizado'}
                    </span>

                    {quiz.estado === 'activo' && (
                      <button
                        type="button"
                        className="gd-btn gd-btn-small"
                        onClick={() =>
                          navigate(
                            `/grupos/${code}/quizzes/${quiz.id}/resolver`,
                          )
                        }
                      >
                        Resolver
                      </button>
                    )}
                  </article>
                </article>
              </article>
            ))}
          </article>
        )}
      </section>
    </>
  );
}