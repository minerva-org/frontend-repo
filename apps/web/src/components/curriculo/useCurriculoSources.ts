import { useEffect, useMemo, useRef, useState } from 'react';
import type { CurriculoSourceEntry } from './CurriculoFuentePanel.tsx';
import {
  getFuentes,
  uploadFuente,
  removeFuente,
} from '../../services/CurriculoService';

export function useCurriculoSources(grupoId: string) {
  const [sources, setSources] = useState<CurriculoSourceEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles] = useState<Array<{
    documentoId: string;
    checksumSha256: string;
    nombre: string;
    file: File;
  }>>([]);

  useEffect(() => {
    let cancelled = false;
    void getFuentes(grupoId)
      .then((documents) => {
        if (cancelled) return;
        setSources(documents.map((document) => ({
          id: document.id,
          name: document.originalFilename,
          status: 'disponible',
        })));
      })
      .catch(() => {
        if (!cancelled) setSources([]);
      });
    return () => {
      cancelled = true;
    };
  }, [grupoId]);

  const hasNewSource = useMemo(
    () => sources.some((source) => source.status === 'nueva'),
    [sources],
  );

  const addSource = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setSourceName(file.name);
    try {
      const document = await uploadFuente(grupoId, file);
      setSources((current) => [
        ...current.filter((source) => source.id !== document.id),
        {
          id: document.id,
          name: document.originalFilename,
          status: 'nueva',
        },
      ]);
      setNewFiles((current) => [
        ...current.filter((entry) => entry.documentoId !== document.id),
        {
          documentoId: document.id,
          checksumSha256: document.checksumSha256,
          nombre: document.originalFilename,
          file,
        },
      ]);
    } catch (caught) {
      setUploadError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo subir la fuente.',
      );
    } finally {
      setUploading(false);
    }
  };

  const removeSource = async (documentoId: string) => {
    await removeFuente(grupoId, documentoId);
    setSources((current) =>
      current.filter((source) => source.id !== documentoId),
    );
    setNewFiles((current) =>
      current.filter((entry) => entry.documentoId !== documentoId),
    );
  };

  const markNewSourcesProcessed = () => {
    setSources((current) =>
      current.map((source) =>
        source.status === 'nueva'
          ? { ...source, status: 'disponible' }
          : source,
      ),
    );
    setNewFiles([]);
    setGenerating(false);
  };

  const generate = () => {
    if (!hasNewSource) return;
    setGenerating(true);
  };

  const stopGenerating = () => setGenerating(false);

  const openFilePicker = () => fileInputRef.current?.click();

  return {
    sources,
    generating,
    uploading,
    uploadError,
    sourceName,
    hasNewSource,
    fileInputRef,
    addSource,
    generate,
    openFilePicker,
    removeSource,
    newFiles,
    markNewSourcesProcessed,
    stopGenerating,
  };
}
