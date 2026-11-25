import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';

export interface NodePosition {
  id: string;
  node: NodoCurricular;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface ConnectorPosition {
  key: string;
  path: string;
}

export interface CurriculoCanvasLayoutResult {
  width: number;
  height: number;
  nodes: NodePosition[];
  connectors: ConnectorPosition[];
  concepts: NodePosition[];
  centeringNodes: NodePosition[];
}

const NODE_HEIGHT = 44;
const ROW_HEIGHT = 112;
const ROOT_Y = 20;
const HORIZONTAL_GAP = 28;
const HORIZONTAL_PADDING = 300;

export interface CurriculoCanvasLayoutOptions {
  slotWidth?: number;
}

function nodeWidth(node: NodoCurricular): number {
  if (node.tipo === 'materia') return 220;
  if (node.tipo === 'unidad') return 220;
  if (node.tipo === 'tema') return 190;
  return 180;
}

export function calculateCurriculoCanvasLayout(
  tree: NodoCurricular,
  expandedIds: Set<string>,
  options: CurriculoCanvasLayoutOptions = {},
): CurriculoCanvasLayoutResult {
  const positions = new Map<string, NodePosition>();
  const slotWidth = options.slotWidth ?? 600;
  let leafCursor = 0;

  const place = (node: NodoCurricular, depth: number): NodePosition => {
    const width = nodeWidth(node);
    const visibleChildren =
      expandedIds.has(node.id) ? (node.hijos ?? []) : [];

    let x: number;
    if (!visibleChildren.length) {
      x = leafCursor * (slotWidth + HORIZONTAL_GAP);
      leafCursor++;
    } else {
      const childPositions = visibleChildren.map((child) => place(child, depth + 1));
      const left = childPositions[0].x;
      const right = childPositions[childPositions.length - 1].x
        + childPositions[childPositions.length - 1].width;
      x = (left + right - width) / 2;
    }

    const position: NodePosition = {
      id: node.id,
      node,
      x,
      y: ROOT_Y + depth * ROW_HEIGHT,
      width,
      height: NODE_HEIGHT,
      depth,
    };
    positions.set(node.id, position);
    return position;
  };

  const root = place(tree, 0);
  const allPositions = Array.from(positions.values());

  const minX = Math.min(...allPositions.map((position) => position.x));
  const maxRight = Math.max(
    ...allPositions.map((position) => position.x + position.width),
  );
  const layoutWidth = Math.max(
    900,
    maxRight - minX + HORIZONTAL_PADDING * 2,
  );
  const shiftX = (layoutWidth - (maxRight - minX)) / 2 - minX;

  allPositions.forEach((position) => {
    position.x += shiftX;
  });
  root.x = positions.get(tree.id)?.x ?? root.x;

  const connectors: ConnectorPosition[] = [];
  const collectConnectors = (node: NodoCurricular) => {
    if (!expandedIds.has(node.id) || !node.hijos?.length) return;

    const parent = positions.get(node.id);
    if (!parent) return;

    const children = node.hijos
      .map((child) => positions.get(child.id))
      .filter((child): child is NodePosition => !!child);
    if (!children.length) return;

    const parentCenterX = parent.x + parent.width / 2;
    const parentBottom = parent.y + parent.height;
    const childCenters = children
      .map((child) => child.x + child.width / 2)
      .sort((a, b) => a - b);
    const leftX = childCenters[0];
    const rightX = childCenters[childCenters.length - 1];
    const middleIndex = Math.floor(childCenters.length / 2);
    const anchorX = childCenters.length % 2 === 1
      ? childCenters[middleIndex]
      : (childCenters[middleIndex - 1] + childCenters[middleIndex]) / 2;
    const horizontalY = parentBottom + 34;
    const childTop = Math.min(...children.map((child) => child.y));

    connectors.push({
      key: `${node.id}-trunk`,
      path: `M ${parentCenterX} ${parentBottom} L ${parentCenterX} ${horizontalY} L ${anchorX} ${horizontalY}`,
    });

    if (children.length > 1) {
      connectors.push({
        key: `${node.id}-bar`,
        path: `M ${leftX} ${horizontalY} L ${rightX} ${horizontalY}`,
      });
    }

    children.forEach((child) => {
      const childCenterX = child.x + child.width / 2;
      connectors.push({
        key: `${node.id}-${child.id}`,
        path: `M ${childCenterX} ${horizontalY} L ${childCenterX} ${childTop}`,
      });
    });

    node.hijos.forEach(collectConnectors);
  };
  collectConnectors(tree);

  const maxDepth = Math.max(...allPositions.map((position) => position.depth));
  const concepts = allPositions.filter(
    (position) => position.node.tipo === 'concepto',
  );
  const centeringNodes: NodePosition[] = [];

  const collectVisibleFrontier = (node: NodoCurricular) => {
    const position = positions.get(node.id);
    const visibleChildren =
      expandedIds.has(node.id) ? (node.hijos ?? []) : [];

    if (!visibleChildren.length) {
      if (position) centeringNodes.push(position);
      return;
    }

    visibleChildren.forEach(collectVisibleFrontier);
  };
  collectVisibleFrontier(tree);

  return {
    width: layoutWidth,
    height: ROOT_Y + (maxDepth + 1) * ROW_HEIGHT + 40,
    nodes: allPositions,
    connectors,
    concepts,
    centeringNodes,
  };
}
