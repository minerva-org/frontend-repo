import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/ApiClient';

function toDateValue(value?: string | null): number {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortQuizDesc(left: QuizCatalogCardData, right: QuizCatalogCardData): number {
  return toDateValue(right.fechaInicio) - toDateValue(left.fechaInicio) || right.nombre.localeCompare(left.nombre);
}

function formatDate(value?: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function GrupoDetalleAlumno({ code }: { code: string }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizCatalogCardData[]>([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizTab, setQuizTab] = useState<QuizTab>('activos');

  useEffect(() => {
    let cancelled = false;

    async function loadQuizzes() {
      try {
        const [grupoResponse, alumnosResponse] = await Promise.all([
          apiClient.get<GrupoDetalleBackend>(`/api/grupos/${code}`),
          apiClient.get<string[]>(`/api/grupos/${code}/alumnos-detalle`),
        ]);

        const endpoints = [
          `/api/quizzes?grupoId=${encodeURIComponent(code)}`,
          `/api/quizzes?grupo=${encodeURIComponent(code)}`,
        ];

        const nextGrupo = {
          ...grupoResponse.data,
          alumnosIds: alumnosResponse.data ?? [],
        };

        setGrupo(nextGrupo);
        setDocenteNombre(nextGrupo.docenteId);
        setAlumnos(
          (nextGrupo.alumnosIds ?? []).map((id) => ({
            id,
            nombre: id,
            estado: 'normal',
          })),
        );
      } catch (error) {
        console.error('Error cargando detalle del grupo:', error);
        if (!cancelled) {
          setQuizzes([]);
          setQuizError('No se pudieron cargar los quizzes de este grupo.');
        }
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    }

    void loadQuizzes();
    return () => { cancelled = true; };
  }, [code]);

  const quizCatalog = useMemo(() => {
    return [...quizzes].sort(sortQuizDesc).map((quiz) => ({
      ...quiz,
      estado: getQuizCatalogState(quiz),
    }));
  }, [quizzes]);

  const quizGroups = useMemo(() => ({
    activos: quizCatalog.filter((quiz) => quiz.estado === 'activo'),
    proximos: quizCatalog.filter((quiz) => quiz.estado === 'proximo'),
    pasados: quizCatalog.filter((quiz) => quiz.estado === 'pasado'),
  }), [quizCatalog]);

  const quizVisible = quizTab === 'activos' ? quizGroups.activos : quizTab === 'proximos' ? quizGroups.proximos : quizGroups.pasados;

  return (
    <>
      <section className="gd-hero">
        <span className="gd-hero-id">ID: {code}</span>
        <article className="gd-hero-row">
          <h1 className="gd-hero-title">Quizzes del grupo</h1>
          <span className="gd-hero-cycle">Grupo seleccionado</span>
        </article>
      </section>

      <section className="gd-info">
        <article className="gd-meta">
          <span className="gd-meta-item"><strong className="gd-meta-label">Grupo:</strong> {code}</span>
        </article>
      </section>

      <section className="gd-card">
        <article className="gd-card-header">
          <span className="gd-card-title"><i className="bi bi-journal-text"></i> Quizzes del grupo</span>
        </article>

        <article className="gd-student-list">
          {alumnos.length === 0 ? (
            <p className="gd-empty">Aún no hay alumnos asociados a este grupo.</p>
          ) : (
            alumnos.map((alumno) => (
              <article key={alumno.id} className="gd-student">
                <span>{alumno.nombre}</span>
              </article>
            ))
          )}
        </article>

        <article className="gd-quiz-actions">
          <button className="gd-btn gd-btn-primary" onClick={() => navigate(`/grupos/${grupo.id}`)}>
            <i className="bi bi-journal-plus"></i> Ir a quizzes
          </button>
          <button type="button" className={`gd-quiz-tab ${quizTab === 'proximos' ? 'active' : ''}`} onClick={() => setQuizTab('proximos')}>
            Próximos ({quizGroups.proximos.length})
          </button>
          <button type="button" className={`gd-quiz-tab ${quizTab === 'pasados' ? 'active' : ''}`} onClick={() => setQuizTab('pasados')}>
            Pasados ({quizGroups.pasados.length})
          </button>
        </article>

        {quizLoading ? (
          <p className="gd-empty">Cargando quizzes del grupo...</p>
        ) : quizError ? (
          <p className="gd-empty">{quizError}</p>
        ) : quizVisible.length === 0 ? (
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
              <article key={quiz.id} className={`gd-quiz ${quiz.estado === 'pasado' ? 'gd-quiz-past' : ''}`}>
                <article className="gd-quiz-row">
                  <article className="gd-quiz-info">
                    <span className="gd-quiz-title">{quiz.nombre}</span>
                    <span className="gd-quiz-meta">
                      {quiz.fechaCreacion ? `Creado: ${formatDate(quiz.fechaCreacion)} · ` : ''}
                      {quiz.estado === 'activo'
                        ? 'Disponible ahora'
                        : quiz.estado === 'proximo'
                          ? `Inicia: ${formatDate(quiz.fechaInicio)}`
                          : `Cerró: ${formatDate(quiz.fechaFinalizacion)}`}
                    </span>
                  </article>

                  <article className="gd-quiz-side">
                    <span className={`gd-badge ${quiz.estado === 'activo' ? 'gd-badge-ok' : 'gd-badge-fecha'}`}>
                      {quiz.estado === 'activo' ? 'Activo' : quiz.estado === 'proximo' ? 'Próximo' : 'Finalizado'}
                    </span>
                    {quiz.estado === 'activo' && (
                      <button type="button" className="gd-btn gd-btn-small" onClick={() => navigate(`/grupos/${code}/quizzes/${quiz.id}/resolver`)}>
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
