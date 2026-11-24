import { useEffect, useMemo, useRef, useState } from 'react';
import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';
import { calculateCurriculoCanvasLayout } from './CurriculoCanvasLayout.ts';
import { cloneCurriculoTree, findCurriculoNode } from './CurriculoCanvasOperations.ts';

export function expandAllCurriculoNodes(tree: NodoCurricular): Set<string> {
  const expanded = new Set<string>();
  const collect = (node: NodoCurricular) => {
    expanded.add(node.id);
    (node.hijos ?? []).forEach(collect);
  };
  collect(tree);
  return expanded;
}

export function useCurriculoCanvasState(initialTree: NodoCurricular) {
  const [tree, setTree] = useState(() => cloneCurriculoTree(initialTree));
  const [selectedId, setSelectedId] = useState<string | null>(initialTree.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => expandAllCurriculoNodes(initialTree),
  );
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLElement>(null);

  const canvasLayout = useMemo(
    () => calculateCurriculoCanvasLayout(tree, expandedIds),
    [tree, expandedIds],
  );

  const changeZoom = (nextZoom: number) => {
    setZoom(Math.min(1.6, Math.max(0.6, nextZoom)));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const replaceTree = (nextTree: NodoCurricular) => {
    setTree(cloneCurriculoTree(nextTree));
    setSelectedId(nextTree.id);
    setExpandedIds(expandAllCurriculoNodes(nextTree));
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || canvasLayout.centeringNodes.length === 0) return;
      const left = Math.min(
        ...canvasLayout.centeringNodes.map((node) => node.x),
      );
      const right = Math.max(
        ...canvasLayout.centeringNodes.map(
          (node) => node.x + node.width,
        ),
      );
      const visibleCenter = (left + right) / 2;
      canvas.scrollLeft = Math.max(
        0,
        visibleCenter * zoom - canvas.clientWidth / 2,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [canvasLayout.centeringNodes, zoom]);

  return {
    tree,
    setTree,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    expandedIds,
    setExpandedIds,
    zoom,
    changeZoom,
    canvasRef,
    canvasLayout,
    toggleExpanded,
    replaceTree,
    findNode: (id: string) => findCurriculoNode(tree, id),
  };
}
