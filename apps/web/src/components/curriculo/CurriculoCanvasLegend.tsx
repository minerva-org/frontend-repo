interface Props {
  variant?: 'curriculum' | 'materia';
}

export default function CurriculoCanvasLegend({
  variant = 'curriculum',
}: Props) {
  if (variant === 'materia') {
    return (
      <section className="curriculo-legend">
        <strong>Leyenda</strong>
        <span><i className="bi bi-book" /> Materia</span>
        <span><i className="bi bi-layers" /> Unidad</span>
        <span><i className="bi bi-diagram-3" /> Tema</span>
        <span><i className="bi bi-lightbulb" /> Concepto</span>
        <span><i className="legend-outline state-unsaved" /> Cambios sin guardar</span>
        <span><i className="legend-dot state-sin_contenido" /> Sin contenido</span>
        <small>
          El contenido relacionado se agrega por grupo. En esta etapa solo se crea la estructura de la materia.
        </small>
      </section>
    );
  }

  return (
    <section className="curriculo-legend">
      <strong>Leyenda</strong>
      <span><i className="bi bi-book" /> Materia</span>
      <span><i className="bi bi-layers" /> Unidad</span>
      <span><i className="bi bi-diagram-3" /> Tema</span>
      <span><i className="bi bi-lightbulb" /> Concepto</span>
      <span><i className="legend-outline state-unsaved" /> Cambios sin guardar</span>
      <span><i className="legend-dot state-visto" /> Visto</span>
      <span><i className="legend-dot state-planeado" /> Planeado</span>
      <span><i className="legend-dot state-con_contenido" /> Con contenido</span>
      <span><i className="legend-dot state-sin_contenido" /> Sin contenido</span>
      <small>
        Los conceptos grises no se consideran en la generación automática de Quiz.
      </small>
    </section>
  );
}
