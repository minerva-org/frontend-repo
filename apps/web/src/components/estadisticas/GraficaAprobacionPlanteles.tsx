import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import type { ChartOptions, TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';

import type { EstadisticasPlantel } from '../../types/EstadisticasTypes';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const UMBRAL_APROBATORIO = 70;

interface GraficaAprobacionPlantelesProps {
  planteles: EstadisticasPlantel[];
}

export default function GraficaAprobacionPlanteles({
  planteles,
}: GraficaAprobacionPlantelesProps) {
  const [colores, setColores] = useState({
    exito: '#3f8d5f',
    alerta: '#b9791f',
    texto: '#243c4c',
  });

  useEffect(() => {
    const estilos = getComputedStyle(document.documentElement);

    setColores({
      exito: estilos.getPropertyValue('--seige-exito').trim() || '#3f8d5f',
      alerta: estilos.getPropertyValue('--seige-alerta').trim() || '#b9791f',
      texto: estilos.getPropertyValue('--seige-texto').trim() || '#243c4c',
    });
  }, []);

  const data = {
    labels: planteles.map((p) => p.nombrePlantel),
    datasets: [
      {
        label: 'Aprobación',
        data: planteles.map((p) => p.porcentajeAprobacion),
        backgroundColor: planteles.map((p) =>
          p.porcentajeAprobacion >= UMBRAL_APROBATORIO
            ? colores.exito
            : colores.alerta
        ),
        borderRadius: 8,
        maxBarThickness: 48,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const plantel = planteles[context.dataIndex];
            return `${(context.parsed.y ?? 0).toFixed(1)}% (${plantel.intentosFinalizados} intentos, ${plantel.alumnosEvaluados} alumnos)`;
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
          Aprobación por plantel
        </h3>

        <p className="small mb-3" style={{ color: 'var(--seige-texto-secundario)' }}>
          Porcentaje de intentos aprobados en cada plantel.
        </p>

        <article className="position-relative w-100" style={{ height: '260px' }}>
          {planteles.length > 0 ? (
            <Bar data={data} options={options} />
          ) : (
            <article
              className="d-flex h-100 align-items-center justify-content-center small"
              style={{ color: 'var(--seige-texto-secundario)' }}
            >
              No hay intentos registrados por plantel.
            </article>
          )}
        </article>
      </article>
    </section>
  );
}