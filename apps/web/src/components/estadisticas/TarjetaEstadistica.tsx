
interface TarjetaEstadisticaProps {
  titulo: string;
  valor: string | number;
  descripcion: string;
  colorValor?: string;
}

export default function TarjetaEstadistica({
  titulo,
  valor,
  descripcion,
  colorValor = 'var(--ar-profundo)',
}: TarjetaEstadisticaProps) {
  return (
    <article
      className="card h-100 border rounded-3 shadow-sm"
      style={{
        backgroundColor: 'var(--seige-superficie)',
        borderColor: 'var(--seige-borde)',
        color: 'var(--seige-texto)', }}>
      <article className="card-body p-3">
        <p className="mb-2 text-uppercase fw-semibold"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            color: 'var(--seige-texto-secundario)', }} > {titulo} </p>

        <p className="mb-1 fw-bold lh-1" style={{ fontSize: '2rem', color: colorValor }}> {valor} </p>
        <p className="mb-0 small" style={{ color: 'var(--seige-texto-secundario)' }}> {descripcion} </p>
      </article>
    </article>
  );
}