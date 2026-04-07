'use client';

import { useMemo } from 'react';

interface MainCanvasBackgroundProps {
  backgroundImage: string;
  backgroundBlur: number;
  backgroundOpacity: number;
  backgroundSize: string;
  backgroundRepeat: string;
}

export default function MainCanvasBackground({
  backgroundImage,
  backgroundBlur,
  backgroundOpacity,
  backgroundSize,
  backgroundRepeat,
}: MainCanvasBackgroundProps) {
  const resolvedBackgroundImage = useMemo(() => {
    if (
      backgroundImage &&
      (backgroundImage.startsWith('http') ||
        backgroundImage.startsWith('/') ||
        backgroundImage.startsWith('data:'))
    ) {
      return `url(${backgroundImage})`;
    }

    return backgroundImage || 'radial-gradient(#d1d5db 2px, transparent 2px)';
  }, [backgroundImage]);

  const resolvedBackgroundSize = backgroundImage ? backgroundSize || 'cover' : '24px 24px';
  const resolvedBackgroundRepeat = backgroundImage ? backgroundRepeat || 'no-repeat' : 'repeat';

  const decorativeGlow = useMemo(
    () =>
      [
        'radial-gradient(circle at 18% 20%, rgba(var(--primary-color), 0.18), transparent 34%)',
        'radial-gradient(circle at 82% 16%, rgba(255,255,255,0.4), transparent 22%)',
        'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 40%, rgba(15,23,42,0.04) 100%)',
      ].join(', '),
    []
  );

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: resolvedBackgroundImage,
          backgroundSize: resolvedBackgroundSize,
          backgroundRepeat: resolvedBackgroundRepeat,
          backgroundPosition: 'center',
          filter: `blur(${backgroundBlur}px)`,
          transform: backgroundBlur > 0 ? 'scale(1.04)' : undefined,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: decorativeGlow }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-slate-950"
        style={{ opacity: backgroundOpacity }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.65) 100%)',
        }}
      />
    </>
  );
}
