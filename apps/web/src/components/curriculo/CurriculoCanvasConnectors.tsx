import type { ConnectorPosition } from './CurriculoCanvasLayout.ts';

interface Props {
  connectors: ConnectorPosition[];
  width: number;
  height: number;
}

export default function CurriculoCanvasConnectors({
  connectors,
  width,
  height,
}: Props) {
  return (
    <svg
      className="curriculo-connectors"
      aria-hidden="true"
      width={width}
      height={height}
    >
      {connectors.map((connector) => (
        <path key={connector.key} d={connector.path} />
      ))}
    </svg>
  );
}
