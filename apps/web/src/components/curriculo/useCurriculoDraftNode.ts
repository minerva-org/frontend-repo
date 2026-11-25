import { useState } from 'react';
import type { NodoCurricular } from '../../types/CurriculoCanvasTypes.ts';
import { createCurriculoDraftNode } from './CurriculoCanvasOperations.ts';

export function useCurriculoDraftNode() {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [draftNode, setDraftNode] = useState<NodoCurricular | null>(null);

  const selectType = (tipo: NodoCurricular['tipo']) => {
    setDraftNode((current) =>
      current ?? createCurriculoDraftNode(tipo),
    );
    setShowTypeSelector(false);
  };

  const changeName = (nombre: string) => {
    setDraftNode((current) =>
      current ? { ...current, nombre } : current,
    );
  };

  const discard = () => setDraftNode(null);

  const toggleTypeSelector = () => {
    setShowTypeSelector((current) => !current);
  };

  const closeTypeSelector = () => setShowTypeSelector(false);

  return {
    draftNode,
    showTypeSelector,
    selectType,
    changeName,
    discard,
    toggleTypeSelector,
    closeTypeSelector,
  };
}
