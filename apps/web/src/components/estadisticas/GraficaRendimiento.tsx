import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

import type { ChartOptions, TooltipItem } from 'chart.js';

import { Bar } from 'react-chartjs-2';
import LeyendaGrafica from './LeyendaGrafica';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

interface GraficaRendimientoProps {
  promedio: number;
  aprobacion: number;
  focoLimpio: number;
}

export default function GraficaRendimiento({
  promedio,
  aprobacion,
  focoLimpio,
}: GraficaRendimientoProps) {
  const [colores, setColores] = useState({
    profundo: '#243c4c',
    azul: '#5289ad',
    acero: '#698696',
    texto: '#243c4c',
  });

  useEffect(() => {
    const estilos = getComputedStyle(document.documentElement);

    setColores({
      profundo:
        estilos.getPropertyValue('--ar-profundo').trim() || '#243c4c',
      azul:
        estilos.getPropertyValue('--ar-azul').trim() || '#5289ad',
      acero:
        estilos.getPropertyValue('--ar-acero').trim() || '#698696',
      texto:
        estilos.getPropertyValue('--seige-texto').trim() || '#243c4c',
    });
  }, []);

  const data = {
    labels: ['Promedio general', 'Aprobación', 'Foco limpio'],
    datasets: [
      {
        label: 'Porcentaje',
        data: [promedio, aprobacion, focoLimpio],
        backgroundColor: [
          colores.profundo,
          colores.azul,
          colores.acero,
        ],
        borderRadius: 8,
        barThickness: 32,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const valor = context.parsed.x ?? 0;
            return `${valor.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          color: colores.texto,
          callback: (value: string | number) => `${value}%`,
        },
        grid: {
          color: 'rgba(105, 134, 150, 0.15)',
        },
      },
      y: {
        ticks: {
          color: colores.texto,
        },
        grid: {
          display: false,
        },
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
          Indicadores de rendimiento
        </h3>

        <p
          className="small mb-3"
          style={{ color: 'var(--seige-texto-secundario)' }}
        >
          Comparación de los principales indicadores porcentuales.
        </p>

        <article className="position-relative w-100" style={{ height: '260px' }}>
          <Bar data={data} options={options} />
        </article>
        <LeyendaGrafica
          items={[
            {
              color: colores.profundo,
              label: 'Promedio general',
              description: 'Respuestas correctas respecto de todas las preguntas respondidas.',
            },
            {
              color: colores.azul,
              label: 'Aprobación',
              description: 'Intentos con calificación igual o mayor a 70%.',
            },
            {
              color: colores.acero,
              label: 'Foco limpio',
              description: 'Intentos finalizados sin cambios de pantalla.',
            },
          ]}
        />
      </article>
    </section>
  );
}