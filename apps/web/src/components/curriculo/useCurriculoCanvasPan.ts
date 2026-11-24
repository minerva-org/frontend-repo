import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

export function useCurriculoCanvasPan() {
  const panRef = useRef({
    active: false,
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, canvas: HTMLElement | null) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(
          '.curriculo-node, .curriculo-draft-node, .curriculo-canvas-toolbar, .curriculo-legend, .curriculo-add-node-wrapper',
        )
      ) return;
      if (!canvas) return;

      event.preventDefault();
      panRef.current = {
        active: true,
        x: event.clientX,
        y: event.clientY,
        scrollLeft: canvas.scrollLeft,
        scrollTop: canvas.scrollTop,
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-panning');
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>, canvas: HTMLElement | null) => {
      const pan = panRef.current;
      if (!pan.active || !canvas) return;
      canvas.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
      canvas.scrollTop = pan.scrollTop - (event.clientY - pan.y);
    },
    [],
  );

  const onPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>, canvas: HTMLElement | null) => {
      panRef.current.active = false;
      canvas?.classList.remove('is-panning');
      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const onPointerCancel = useCallback((canvas: HTMLElement | null) => {
    panRef.current.active = false;
    canvas?.classList.remove('is-panning');
  }, []);

  const onDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, canvas: HTMLElement | null) => {
      event.preventDefault();
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const edge = 64;
      if (event.clientX - rect.left < edge) canvas.scrollLeft -= 18;
      else if (rect.right - event.clientX < edge) canvas.scrollLeft += 18;
      if (event.clientY - rect.top < edge) canvas.scrollTop -= 18;
      else if (rect.bottom - event.clientY < edge) canvas.scrollTop += 18;
    },
    [],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    onPointerCancel,
    onDragOver,
  };
}
