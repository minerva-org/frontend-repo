
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
  Realizado?: boolean;
}

interface IntentoEstado {
  quizId: string;
  intentoId: string;
  finalizado: boolean;
}

type QuizEstado = 'activo' | 'proximo' | 'pasado';
type QuizTab = 'activos' | 'proximos' | 'pasados';

interface QuizAlumnoDetalle extends QuizBackend {
  estado: QuizEstado;
  intento?: IntentoEstado;
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

  const [quizTab, setQuizTab] = useState<QuizTab>('activos');

  const [intentos, setIntentos] = useState<IntentoEstado[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function cargarDetalle() {
      try {
        setLoading(true);
        setError(null);

        const [grupoResponse, quizzesResponse, intentosResponse] = await Promise.all([
          apiClient.get<GrupoDetalleBackend>(`/api/grupos/${code}`),
          apiClient.get<QuizBackend[]>('/api/quizzes'),
          apiClient.get<IntentoEstado[]>('/api/quizzes/mis-intentos'),
        ]);

        if (cancelled) return;

        const grupoData = grupoResponse.data;

        setGrupo(grupoData);
        setIntentos(intentosResponse.data ?? []);

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
        intento:intentos.find((i) => i.quizId ===quiz.id),
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
  }, [quizzes, intentos]);

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
      <p className="text-center text-secondary py-4 mb-0">
        Cargando información del grupo...
      </p>
    );
  }

  if (error || !grupo) {
    return (
      <p className="text-center text-secondary py-4 mb-0">
        {error ?? 'No se encontró el grupo.'}
      </p>
    );
  }

  return (
    <>
      <section className="d-flex flex-column gap-2 p-4 rounded-3 text-light bg-primary bg-gradient shadow-sm">
        <h1 className="fs-3 fw-bold mb-0">
          {grupo.nombre}
        </h1>
      </section>

      <section className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 p-3 rounded-3 bg-white border">
        <article className="d-flex flex-wrap align-items-center gap-3">
          <span className="d-flex align-items-center gap-2">
            <strong>Semestre:</strong>
            {grupo.semestre}
          </span>

          <span className="d-flex align-items-center gap-2">
            <strong>Estado:</strong>
            <span
              className={`badge ${
                grupo.activo
                  ? 'bg-success-subtle text-success-emphasis'
                  : 'bg-secondary-subtle text-secondary-emphasis'
              }`}
            >
              {grupo.activo ? 'Activo' : 'Inactivo'}
            </span>
          </span>
        </article>
      </section>

      <section className="d-flex flex-column gap-3 p-3 p-md-4 rounded-3 bg-white border shadow-sm">
        <article className="d-flex align-items-center gap-2">
          <i className="bi bi-journal-text fs-5 text-primary"></i>
          <h2 className="fs-5 fw-bold mb-0">Quizzes</h2>
        </article>

        <article className="nav nav-pills nav-fill gap-2">
          <button
            type="button"
            className={`nav-link ${
              quizTab === 'activos'
                ? 'active bg-secondary text-light'
                : 'text-body'
            }`}
            onClick={() => setQuizTab('activos')}
          >
            Activos ({quizGroups.activos.length})
          </button>

          <button
            type="button"
            className={`nav-link ${
              quizTab === 'proximos'
                ? 'active bg-secondary text-light'
                : 'text-body'
            }`}
            onClick={() => setQuizTab('proximos')}
          >
            Próximos ({quizGroups.proximos.length})
          </button>

          <button
            type="button"
            className={`nav-link ${
              quizTab === 'pasados'
                ? 'active bg-secondary text-light'
                : 'text-body'
            }`}
            onClick={() => setQuizTab('pasados')}
          >
            Pasados ({quizGroups.pasados.length})
          </button>
        </article>

        {quizVisible.length === 0 ? (
          <p className="text-center text-secondary py-4 mb-0">
            {quizTab === 'activos'
              ? 'No hay quizzes activos para este grupo.'
              : quizTab === 'proximos'
                ? 'No hay quizzes próximos para este grupo.'
                : 'No hay quizzes pasados para este grupo.'}
          </p>
        ) : (
          <article className="d-flex flex-column gap-3">
            {quizVisible.map((quiz) => (
              <article
                key={quiz.id}
                className={`d-flex flex-column gap-3 p-3 rounded-3 border ${
                  quiz.estado === 'pasado'
                    ? 'bg-body-secondary'
                    : 'bg-white'
                }`}
              >
                <article className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                  <article className="d-flex flex-column gap-1">
                    <span className="fw-bold">
                      {quiz.nombre}
                    </span>

                    <span className="small text-secondary">
                      {quiz.estado === 'activo'
                        ? `Finaliza: ${formatDate(quiz.fechaFinalizacion)}`
                        : quiz.estado === 'proximo'
                          ? `Inicia: ${formatDate(quiz.fechaInicio)}`
                          : `Finalizó: ${formatDate(quiz.fechaFinalizacion)}`}
                    </span>
                  </article>

                  <article className="d-flex flex-row flex-sm-column align-items-center align-items-sm-end gap-2">
                    <span
                      className={`badge ${
                        quiz.estado === 'activo'
                          ? 'bg-success-subtle text-success-emphasis'
                          : quiz.estado === 'proximo'
                            ? 'bg-warning-subtle text-warning-emphasis'
                            : 'bg-secondary-subtle text-secondary-emphasis'
                      }`}
                    >
                      {quiz.estado === 'activo'
                        ? 'Activo'
                        : quiz.estado === 'proximo'
                          ? 'Próximo'
                          : 'Finalizado'}
                    </span>

                    {quiz.intento?.finalizado ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        title="Pantalla de resultados pendiente"
                        onClick={() =>{
                          navigate(`/grupos/${code}/quizzes/${quiz.id}/resolver`)
                        }}
                      >
                        <i className="bi bi-bar-chart me-1"></i>
                        Ver resultados
                      </button>
                    ) : (
                      quiz.estado === 'activo' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            navigate(`/grupos/${code}/quizzes/${quiz.id}/resolver`)
                          }
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          {quiz.intento ? 'Continuar' : 'Iniciar Quiz'}
                        </button>
                      )
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
