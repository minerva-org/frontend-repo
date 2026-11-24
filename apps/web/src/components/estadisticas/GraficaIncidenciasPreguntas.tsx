import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import LeyendaGrafica from './LeyendaGrafica';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface GraficaIncidenciasPreguntasProps {
  preguntas: Array<{
    numero: number;
    incidencias: number;
  }>;
}

export default function GraficaIncidenciasPreguntas({
  preguntas,
}: GraficaIncidenciasPreguntasProps) {
  const total = preguntas.reduce(
    (sum, pregunta) => sum + pregunta.incidencias,
    0,
  );

  return (
    <section className="card h-100 border rounded-3 shadow-sm"
      style={{
        backgroundColor: 'var(--seige-superficie)',
        borderColor: 'var(--seige-borde)',
      }}>
      <article className="card-body p-3">
        <h3 className="h6 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Incidencias de foco por pregunta
        </h3>
        <p className="small mb-3 text-secondary">
          Cantidad total de cambios de pantalla registrados en cada pregunta.
        </p>
        <article className="position-relative w-100" style={{ height: '260px' }}>
          {total > 0 ? (
            <Bar
              data={{
                labels: preguntas.map((pregunta) => `Pregunta ${pregunta.numero}`),
                datasets: [{
                  label: 'Incidencias',
                  data: preguntas.map((pregunta) => pregunta.incidencias),
                  backgroundColor: 'var(--seige-alerta)',
                  borderRadius: 6,
                  maxBarThickness: 42,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          ) : (
            <article className="d-flex h-100 align-items-center justify-content-center small text-secondary">
              No se registraron incidencias de foco.
            </article>
          )}
        </article>
        <LeyendaGrafica
          items={[{
            color: 'var(--seige-alerta)',
            label: 'Incidencias',
            description: 'Suma de cambios de pantalla reportados para la pregunta.',
          }]}
        />
      </article>
    </section>
  );
}
