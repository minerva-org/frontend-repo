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

import type { EstadisticasMateria } from '../../types/EstadisticasTypes';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const UMBRAL_APROBATORIO = 70;

interface GraficaAprobacionMateriasProps {
  materias: EstadisticasMateria[];
}

export default function GraficaAprobacionMaterias({
  materias,
}: GraficaAprobacionMateriasProps) {
  const [colores, setColores] = useState({
    exito: 'var(--seige-exito)',
    alerta: 'var(--seige-alerta)',
    texto: 'var(--ar-profundo)',
  });

  useEffect(() => {
    const estilos = getComputedStyle(document.documentElement);

    setColores({
      exito: estilos.getPropertyValue('--seige-exito').trim() || 'var(--seige-exito)',
      alerta: estilos.getPropertyValue('--seige-alerta').trim() || 'var(--seige-alerta)',
      texto: estilos.getPropertyValue('--seige-texto').trim() || 'var(--ar-profundo)',
    });
  }, []);

  const data = {
    labels: materias.map((m) => m.nombreMateria),
    datasets: [
      {
        label: 'Aprobación',
        data: materias.map((m) => m.porcentajeAprobacion),
        backgroundColor: materias.map((m) =>
          m.porcentajeAprobacion >= UMBRAL_APROBATORIO
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
            const materia = materias[context.dataIndex];
            return `${(context.parsed.y ?? 0).toFixed(1)}% (${materia.intentosAprobados} de ${materia.intentosFinalizados} intentos)`;
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
        grid: { color: 'var(--ar-profundo)' },
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
          Aprobados por materia
        </h3>

        <p className="small mb-3" style={{ color: 'var(--seige-texto-secundario)' }}>
          Porcentaje de intentos aprobados en cada materia.
        </p>

        <article className="position-relative w-100" style={{ height: '260px' }}>
          {materias.length > 0 ? (
            <Bar data={data} options={options} />
          ) : (
            <article
              className="d-flex h-100 align-items-center justify-content-center small"
              style={{ color: 'var(--seige-texto-secundario)' }}
            >
              No hay intentos registrados por materia.
            </article>
          )}
        </article>
      </article>
    </section>
  );
}