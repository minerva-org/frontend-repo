import { useState, type Dispatch, type SetStateAction } from 'react';
import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';

export function useCurriculoContent(
  setTree: Dispatch<SetStateAction<NodoCurricular>>,
  markDirty: () => void,
) {
  const [editingContentId, setEditingContentId] =
    useState<string | null>(null);
  const [editingContentText, setEditingContentText] = useState('');

  const updateContent = (
    conceptoId: string,
    contenidoId: string,
    descripcion: string,
  ) => {
    if (!descripcion.trim()) return;
    setTree((current) => {
      const replaceContent = (node: NodoCurricular): NodoCurricular => {
        if (node.id === conceptoId) {
          return {
            ...node,
            revisionEstado: 'modificado',
            estadoConcepto: 'con_contenido',
            contenido: node.contenido.map((item) =>
              item.id === contenidoId
                ? {
                    ...item,
                    descripcion: descripcion.trim(),
                    revisionEstado: 'modificado',
                  }
                : item,
            ),
          };
        }
        return {
          ...node,
          hijos: node.hijos.map(replaceContent),
        };
      };
      return replaceContent(current);
    });
    setEditingContentId(null);
    setEditingContentText('');
    markDirty();
  };

  const addContent = (conceptoId: string) => {
    setTree((current) => {
      const add = (node: NodoCurricular): NodoCurricular => {
        if (node.id === conceptoId) {
          return {
            ...node,
            revisionEstado: 'modificado',
            estadoConcepto: 'con_contenido',
            contenido: [
              ...node.contenido,
              {
                id: `TEMP-CTG-${crypto.randomUUID()}`,
                descripcion: 'Nuevo contenido curricular',
                origen: 'usuario',
                revisionEstado: 'nuevo',
              },
            ],
          };
        }
        return { ...node, hijos: node.hijos.map(add) };
      };
      return add(current);
    });
    markDirty();
  };

  return {
    editingContentId,
    editingContentText,
    setEditingContentId,
    setEditingContentText,
    updateContent,
    addContent,
  };
}
