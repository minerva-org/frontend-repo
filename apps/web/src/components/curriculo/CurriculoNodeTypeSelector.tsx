import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';

interface Props {
  open: boolean;
  onToggle: () => void;
  onSelect: (tipo: NodoCurricular['tipo']) => void;
  disabled: boolean;
}

export default function CurriculoNodeTypeSelector({
  open,
  onToggle,
  onSelect,
  disabled,
}: Props) {
  const types: NodoCurricular['tipo'][] = ['unidad', 'tema', 'concepto'];

  return (
    <article className="curriculo-add-node-wrapper">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm curriculo-add-node"
        disabled={disabled}
        onClick={onToggle}
      >
        <i className="bi bi-plus-lg me-1" />
        Agregar nodo
      </button>
      {open && (
        <article className="curriculo-node-type-selector">
          {types.map((tipo) => (
            <button
              type="button"
              key={tipo}
              onClick={() => onSelect(tipo)}
            >
              <i
                className={`bi ${
                  tipo === 'unidad'
                    ? 'bi-layers'
                    : tipo === 'tema'
                      ? 'bi-diagram-3'
                      : 'bi-lightbulb'
                } me-2`}
              />
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          ))}
        </article>
      )}
    </article>
  );
}
