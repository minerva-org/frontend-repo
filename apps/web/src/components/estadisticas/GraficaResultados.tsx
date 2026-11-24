
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import LeyendaGrafica from './LeyendaGrafica';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GraficaResultadosProps {
  aprobados: number;
  reprobados: number;
  sinResponder?: number;
}

export default function GraficaResultados({
  aprobados,
  reprobados,
  sinResponder = 0,
}: GraficaResultadosProps) {
  const [colores, setColores] = useState({
    aprobado: '#3f8d5f',
    reprobado: '#b9791f',
    pendiente: '#9ca9b4',
    texto: '#243c4c',
    borde: '#ffffff',
  });

  useEffect(() => {
    const estilos = getComputedStyle(document.documentElement);

    setColores({
      aprobado:
        estilos.getPropertyValue('--seige-exito').trim() || '#3f8d5f',
      reprobado:
        estilos.getPropertyValue('--seige-alerta').trim() || '#b9791f',
      pendiente:
        estilos.getPropertyValue('--ar-acero').trim() || '#9ca9b4',
      texto:
        estilos.getPropertyValue('--seige-texto').trim() || '#243c4c',
      borde:
        estilos.getPropertyValue('--seige-superficie').trim() || '#ffffff',
    });
  }, []);

  const total = aprobados + reprobados + sinResponder;

  const data = {
    labels: sinResponder > 0
      ? ['Aprobados', 'Reprobados', 'No respondieron']
      : ['Aprobados', 'Reprobados'],
    datasets: [
      {
        data: sinResponder > 0
          ? [aprobados, reprobados, sinResponder]
          : [aprobados, reprobados],
        backgroundColor: sinResponder > 0
          ? [colores.aprobado, colores.reprobado, colores.pendiente]
          : [colores.aprobado, colores.reprobado],
        borderColor: colores.borde,
        borderWidth: 4,
        hoverOffset: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colores.texto,
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { label: string; parsed: number }) => {
            const porcentaje = total > 0
              ? ((context.parsed / total) * 100).toFixed(1)
              : '0.0';

            return `${context.label}: ${context.parsed} (${porcentaje}%)`;
          },
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
          Resultados de evaluación
        </h3>

        <p
          className="small mb-3"
          style={{ color: 'var(--seige-texto-secundario)' }}
        >
          Distribución de los participantes por resultado.
        </p>

        <article
          className="position-relative w-100"
          style={{ height: '260px' }}
        >
          {total > 0 ? (
            <>
              <Doughnut data={data} options={options} />

              <article
                className="position-absolute top-0 start-0 w-100 d-flex flex-column align-items-center justify-content-center"
                style={{ height: 'calc(100% - 52px)', pointerEvents: 'none' }}
              >
                <span
                  className="fw-bold lh-1"
                  style={{ fontSize: '1.75rem', color: 'var(--ar-profundo)' }}
                >
                  {total}
                </span>
                <span
                  className="small"
                  style={{ color: 'var(--seige-texto-secundario)' }}
                >
                  Intentos
                </span>
              </article>
            </>
          ) : (
            <article
              className="d-flex h-100 align-items-center justify-content-center small"
              style={{ color: 'var(--seige-texto-secundario)' }}
            >
              No hay intentos registrados.
            </article>
          )}
        </article>
        <LeyendaGrafica
          items={[
            {
              color: colores.aprobado,
              label: 'Aprobados',
              description: 'Intentos con calificación igual o mayor a 70%.',
            },
            {
              color: colores.reprobado,
              label: 'Reprobados',
              description: 'Intentos con calificación menor a 70%.',
            },
            ...(sinResponder > 0 ? [{
              color: colores.pendiente,
              label: 'No respondieron',
              description: 'Alumnos con intento asignado que no completaron el quiz.',
            }] : []),
          ]}
        />
      </article>
    </section>
  );
}