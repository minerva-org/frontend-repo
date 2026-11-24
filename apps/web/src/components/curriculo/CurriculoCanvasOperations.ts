import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';

export function cloneCurriculoTree(node: NodoCurricular): NodoCurricular {
  return {
    ...node,
    contenido: (node.contenido ?? []).map((item) => ({ ...item })),
    hijos: (node.hijos ?? []).map(cloneCurriculoTree),
  };
}

export function findCurriculoNode(
  node: NodoCurricular,
  id: string,
): NodoCurricular | null {
  if (node.id === id) return node;
  for (const child of node.hijos ?? []) {
    const found = findCurriculoNode(child, id);
    if (found) return found;
  }
  return null;
}

export function renameCurriculoNode(
  node: NodoCurricular,
  id: string,
  name: string,
): NodoCurricular {
  if (node.id === id) {
    return { ...node, nombre: name, revisionEstado: 'modificado' };
  }
  return {
    ...node,
    hijos: (node.hijos ?? []).map((child) =>
      renameCurriculoNode(child, id, name),
    ),
  };
}

export function moveCurriculoNode(
  tree: NodoCurricular,
  nodeId: string,
  parentId: string,
): NodoCurricular {
  let moved: NodoCurricular | null = null;

  const remove = (node: NodoCurricular): NodoCurricular => ({
    ...node,
    hijos: (node.hijos ?? []).filter((child) => {
      if (child.id === nodeId) {
        moved = cloneCurriculoTree(child);
        return false;
      }
      return true;
    }).map(remove),
  });

  const withoutMoved = remove(cloneCurriculoTree(tree));
  if (!moved) return tree;

  const add = (node: NodoCurricular): NodoCurricular => ({
    ...node,
    hijos: node.id === parentId
      ? [...(node.hijos ?? []), moved as NodoCurricular]
      : (node.hijos ?? []).map(add),
  });

  return add(withoutMoved);
}

export function isCurriculoDescendant(
  node: NodoCurricular,
  descendantId: string,
): boolean {
  return (node.hijos ?? []).some((child) =>
    child.id === descendantId
      ? true
      : isCurriculoDescendant(child, descendantId),
  );
}

export function isValidCurriculoDrop(
  dragged: NodoCurricular,
  target: NodoCurricular,
): boolean {
  if (dragged.id === target.id) return false;
  if (isCurriculoDescendant(dragged, target.id)) return false;
  if (dragged.tipo === 'concepto') return target.tipo === 'tema';
  if (dragged.tipo === 'tema') return target.tipo === 'unidad';
  if (dragged.tipo === 'unidad') return target.tipo === 'materia';
  return false;
}

export function isValidCurriculoDraftDrop(
  draft: NodoCurricular,
  target: NodoCurricular,
): boolean {
  if (draft.tipo === 'concepto') return target.tipo === 'tema';
  if (draft.tipo === 'tema') return target.tipo === 'unidad';
  if (draft.tipo === 'unidad') return target.tipo === 'materia';
  return false;
}

export function createCurriculoDraftNode(
  tipo: NodoCurricular['tipo'],
): NodoCurricular {
  return {
    id: `TEMP-${crypto.randomUUID()}`,
    tipo,
    nombre: '',
    origen: 'usuario',
    revisionEstado: 'nuevo',
    estadoConcepto: tipo === 'concepto' ? 'sin_contenido' : undefined,
    contenido: [],
    hijos: [],
  };
}

export function attachCurriculoDraftNode(
  tree: NodoCurricular,
  draft: NodoCurricular,
  parentId: string,
): NodoCurricular {
  if (tree.id === parentId) {
    return {
      ...tree,
      hijos: [...(tree.hijos ?? []), cloneCurriculoTree(draft)],
    };
  }
  return {
    ...tree,
    hijos: (tree.hijos ?? []).map((child) =>
      attachCurriculoDraftNode(child, draft, parentId),
    ),
  };
}

export function invalidCurriculoAssociationMessage(
  dragged: NodoCurricular,
  target: NodoCurricular,
): string {
  if (dragged.tipo === 'concepto') {
    return 'Un concepto solo puede asociarse a un tema. No puede colocarse directamente bajo una unidad o la materia.';
  }
  if (dragged.tipo === 'tema') {
    return 'Un tema solo puede asociarse a una unidad. No puede colocarse directamente bajo materia o concepto.';
  }
  if (dragged.tipo === 'unidad') {
    return 'Una unidad solo puede asociarse a la materia.';
  }
  return `El nodo ${dragged.nombre || dragged.tipo} no puede asociarse a ${target.nombre || target.tipo}.`;
}
