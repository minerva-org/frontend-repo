import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import type { ChartOptions, TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { EstadisticasTendencia } from '../../types/EstadisticasTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface GraficaTendenciaProps {
  quizzes: EstadisticasTendencia[];
}

const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function GraficaTendencia({ quizzes }: GraficaTendenciaProps) {
  const [colores, setColores] = useState({
    azul: '#5289ad',
    texto: '#243c4c',
  });

  useEffect(() => {
    const estilos = getComputedStyle(document.documentElement);

    setColores({
      azul: estilos.getPropertyValue('--ar-azul').trim() || '#5289ad',
      texto: estilos.getPropertyValue('--seige-texto').trim() || '#243c4c',
    });
  }, []);

  const data = {
    labels: quizzes.map((q) => q.nombreQuiz),
    datasets: [
      {
        label: 'Aprobación',
        data: quizzes.map((q) => q.porcentajeAprobacion),
        borderColor: colores.azul,
        backgroundColor: 'rgba(82, 137, 173, 0.12)',
        pointBackgroundColor: colores.azul,
        pointRadius: 5,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    layout:{
        padding: { top: 8, right: 8},
    },
    clip:false,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => {
            const quiz = quizzes[items[0].dataIndex];
            return `${quiz.nombreQuiz} · ${formatearFecha(quiz.fechaFinalizacion)}`;
          },
          label: (context: TooltipItem<'line'>) => {
            const quiz = quizzes[context.dataIndex];
            return `${(context.parsed.y ?? 0).toFixed(1)}% (${quiz.intentosFinalizados} intentos)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colores.texto },
        grid: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: colores.texto,
          callback: (value: string | number) => `${value}%`,
        },
        grid: { color: 'rgba(105, 134, 150, 0.15)' },
      },
    },
  };

  return (
    <section
      className="card h-100 border rounded-3 shadow-sm"
      style={{
        backgroundColor: 'var(--seige-superficie)',
        borderColor: 'var(--seige-borde)',
      }}
    >
      <article className="card-body p-3">
        <h3 className="h6 fw-bold mb-1" style={{ color: 'var(--ar-profundo)' }}>
          Tendencia de aprobados
        </h3>

        <p
          className="small mb-3"
          style={{ color: 'var(--seige-texto-secundario)' }}
        >
          Aprobados de los últimos quizzes cerrados.
        </p>

        <article className="position-relative w-100" style={{ height: '260px' }}>
          {quizzes.length > 0 ? (
            <Line data={data} options={options} />
          ) : (
            <article
              className="d-flex h-100 align-items-center justify-content-center small"
              style={{ color: 'var(--seige-texto-secundario)' }}
            >
              No hay quizzes cerrados con intentos.
            </article>
          )}
        </article>
      </article>
    </section>
  );
}