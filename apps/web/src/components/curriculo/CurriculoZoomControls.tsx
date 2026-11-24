interface Props {
  zoom: number;
  onChange: (zoom: number) => void;
  stopPropagation?: boolean;
}

export default function CurriculoZoomControls({
  zoom,
  onChange,
  stopPropagation = false,
}: Props) {
  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
  };

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    nextZoom: number,
  ) => {
    if (stopPropagation) event.stopPropagation();
    onChange(nextZoom);
  };

  return (
    <section className="curriculo-zoom-controls" aria-label="Controles de zoom">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={(event) => handleClick(event, zoom - 0.1)}
        disabled={zoom <= 0.6}
        aria-label="Alejar"
        title="Alejar"
      >
        <i className="bi bi-dash-lg" />
      </button>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={(event) => handleClick(event, 1)}
        className="curriculo-zoom-value"
        title="Restablecer zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={(event) => handleClick(event, zoom + 0.1)}
        disabled={zoom >= 1.6}
        aria-label="Acercar"
        title="Acercar"
      >
        <i className="bi bi-plus-lg" />
      </button>
    </section>
  );
}
