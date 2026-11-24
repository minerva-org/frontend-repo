interface LeyendaItem {
  color?: string;
  label: string;
  description: string;
}

interface LeyendaGraficaProps {
  items: LeyendaItem[];
}

export default function LeyendaGrafica({ items }: LeyendaGraficaProps) {
  return (
    <section
      className="mt-2 pt-2 border-top"
      style={{ borderColor: 'var(--seige-borde)' }}
      aria-label="Leyenda de la gráfica"
    >
      {items.map((item) => (
        <article
          key={item.label}
          className="d-flex align-items-start gap-2 small mb-1"
          style={{ color: 'var(--seige-texto-secundario)' }}
        >
          {item.color && (
            <span
              className="flex-shrink-0 rounded-pill mt-1"
              style={{
                width: '0.65rem',
                height: '0.65rem',
                backgroundColor: item.color,
              }}
              aria-hidden="true"
            />
          )}
          <span>
            <strong style={{ color: 'var(--seige-texto)' }}>{item.label}:</strong>{' '}
            {item.description}
          </span>
        </article>
      ))}
    </section>
  );
}
