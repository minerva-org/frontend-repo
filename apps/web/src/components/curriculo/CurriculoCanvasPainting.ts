import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';

export interface ConnectorLine {
  key: string;
  d: string;
}

export interface CanvasLayoutSize {
  width: number;
  height: number;
}

export class CurriculoCanvasPainting {
  private readonly canvasElement: HTMLElement;
  private readonly treeElement: HTMLElement;
  private readonly nodeElements: Map<string, HTMLElement>;

  constructor(
    canvasElement: HTMLElement,
    treeElement: HTMLElement,
    nodeElements: Map<string, HTMLElement>,
  ) {
    this.canvasElement = canvasElement;
    this.treeElement = treeElement;
    this.nodeElements = nodeElements;
  }

  calculateConnectors(
    tree: NodoCurricular,
    expandedIds: Set<string>,
  ): ConnectorLine[] {
    const canvasRect = this.canvasElement.getBoundingClientRect();
    const lines: ConnectorLine[] = [];

    const walk = (node: NodoCurricular) => {
      if (!node.hijos?.length || !expandedIds.has(node.id)) return;

      const parentElement = this.nodeElements.get(node.id);
      if (!parentElement) return;

      const parentRect = parentElement.getBoundingClientRect();
      const childRects = node.hijos
        .map((child) => ({
          child,
          element: this.nodeElements.get(child.id),
        }))
        .filter(
          (entry): entry is { child: NodoCurricular; element: HTMLElement } =>
            !!entry.element,
        )
        .filter(({ element }) => element.offsetParent !== null)
        .map(({ child, element }) => ({
          child,
          rect: element.getBoundingClientRect(),
        }));

      if (!childRects.length) return;

      const parentX = this.toCanvasX(parentRect, canvasRect);
      const parentBottom = this.toCanvasBottom(parentRect, canvasRect);
      const horizontalY = parentBottom + 14;

      const childCenters = childRects
        .map(({ rect }) => this.toCanvasCenterX(rect, canvasRect))
        .sort((a, b) => a - b);

      const leftX = childCenters[0];
      const rightX = childCenters[childCenters.length - 1];
      const anchorX = this.getAnchorX(childCenters);
      const childTop = childRects.reduce(
        (top, entry) =>
          Math.min(top, this.toCanvasTop(entry.rect, canvasRect)),
        this.toCanvasTop(childRects[0].rect, canvasRect),
      );

      lines.push({
        key: `${node.id}-trunk`,
        d: `M ${parentX} ${parentBottom} L ${parentX} ${horizontalY} L ${anchorX} ${horizontalY}`,
      });

      if (childRects.length > 1) {
        lines.push({
          key: `${node.id}-bar`,
          d: `M ${leftX} ${horizontalY} L ${rightX} ${horizontalY}`,
        });
      }

      childRects.forEach(({ child, rect }) => {
        const childX = this.toCanvasCenterX(rect, canvasRect);
        lines.push({
          key: `${node.id}-${child.id}`,
          d: `M ${childX} ${horizontalY} L ${childX} ${childTop}`,
        });
      });

      node.hijos.forEach(walk);
    };

    walk(tree);
    return lines;
  }

  calculateLayoutSize(): CanvasLayoutSize {
    return {
      width: Math.max(
        this.treeElement.scrollWidth,
        this.canvasElement.scrollWidth,
      ),
      height: Math.max(
        this.treeElement.scrollHeight,
        this.canvasElement.scrollHeight,
      ),
    };
  }

  centerVisibleConcepts(): void {
    const canvasRect = this.canvasElement.getBoundingClientRect();
    const conceptElements = Array.from(
      this.treeElement.querySelectorAll<HTMLElement>(
        '.curriculo-node-concepto',
      ),
    ).filter((element) => element.offsetParent !== null);

    if (!conceptElements.length) return;

    const conceptRects = conceptElements.map((element) =>
      element.getBoundingClientRect(),
    );
    const leftConcept = Math.min(...conceptRects.map((rect) => rect.left));
    const rightConcept = Math.max(...conceptRects.map((rect) => rect.right));
    const conceptsCenter = (leftConcept + rightConcept) / 2;
    const canvasCenter = canvasRect.left + this.canvasElement.clientWidth / 2;

    this.canvasElement.scrollLeft += conceptsCenter - canvasCenter;
  }

  private getAnchorX(sortedCenters: number[]): number {
    const middleIndex = Math.floor(sortedCenters.length / 2);
    if (sortedCenters.length % 2 === 1) {
      return sortedCenters[middleIndex];
    }
    return (sortedCenters[middleIndex - 1] + sortedCenters[middleIndex]) / 2;
  }

  private toCanvasX(rect: DOMRect, canvasRect: DOMRect): number {
    return (
      rect.left
      - canvasRect.left
      + rect.width / 2
      + this.canvasElement.scrollLeft
    );
  }

  private toCanvasCenterX(rect: DOMRect, canvasRect: DOMRect): number {
    return (
      rect.left
      - canvasRect.left
      + rect.width / 2
      + this.canvasElement.scrollLeft
    );
  }

  private toCanvasBottom(rect: DOMRect, canvasRect: DOMRect): number {
    return rect.bottom - canvasRect.top + this.canvasElement.scrollTop;
  }

  private toCanvasTop(rect: DOMRect, canvasRect: DOMRect): number {
    return rect.top - canvasRect.top + this.canvasElement.scrollTop;
  }
}
