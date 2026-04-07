'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Widget } from '@/types';

interface UseCanvasMetricsOptions {
  rowHeight: number;
  margin: [number, number];
}

export function useCanvasMetrics({ rowHeight, margin }: UseCanvasMetricsOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const currentCols = useMemo(() => {
    if (!width) return 8;
    if (width >= 1600) return 10;
    if (width >= 1200) return 8;
    if (width >= 900) return 6;
    if (width >= 600) return 4;
    return 2;
  }, [width]);

  const cellWidth = useMemo(() => {
    if (!width) return 0;
    return (width - (currentCols - 1) * margin[0]) / currentCols;
  }, [width, currentCols, margin]);

  const toPixelRect = useCallback(
    (widget: Widget, overridePosition?: { x: number; y: number }) => {
      const position = overridePosition ?? widget.position;
      const left = position.x * (cellWidth + margin[0]);
      const top = position.y * (rowHeight + margin[1]);
      const widthPx = cellWidth * widget.size.w + margin[0] * (widget.size.w - 1);
      const heightPx = rowHeight * widget.size.h + margin[1] * (widget.size.h - 1);
      return { left, top, width: widthPx, height: heightPx };
    },
    [cellWidth, margin, rowHeight]
  );

  return {
    width,
    containerRef,
    currentCols,
    cellWidth,
    toPixelRect,
  };
}
