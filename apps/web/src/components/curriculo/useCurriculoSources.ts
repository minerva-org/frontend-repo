import { useMemo, useRef, useState } from 'react';
import type { CurriculoSourceEntry } from './CurriculoFuentePanel.tsx';

export function useCurriculoSources() {
  const [sources, setSources] = useState<CurriculoSourceEntry[]>([
    { id: 'demo-book', name: 'book.pdf', status: 'disponible' },
  ]);
  const [generating, setGenerating] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasNewSource = useMemo(
    () => sources.some((source) => source.status === 'nueva'),
    [sources],
  );

  const addSource = (file?: File) => {
    if (!file) return;
    setSourceName(file.name);
    setSources((current) => [
      ...current,
      { id: crypto.randomUUID(), name: file.name, status: 'nueva' },
    ]);
  };

  const generate = () => {
    if (!hasNewSource) return;
    setGenerating(true);
    window.setTimeout(() => setGenerating(false), 900);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return {
    sources,
    generating,
    sourceName,
    hasNewSource,
    fileInputRef,
    addSource,
    generate,
    openFilePicker,
  };
}
