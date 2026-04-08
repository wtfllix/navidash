'use client';

import React, { forwardRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useDragDrop } from './DragDropProvider';

interface WidgetDeleteZoneProps {
  visible: boolean;
}

const WidgetDeleteZone = forwardRef<HTMLDivElement, WidgetDeleteZoneProps>(function WidgetDeleteZone(
  { visible },
  forwardedRef
) {
  const t = useTranslations('Widgets');
  const { isOverDeleteZone } = useDragDrop();
  const highlighted = visible && isOverDeleteZone;

  return (
    <div
      className={cn(
        'pointer-events-none fixed right-6 top-1/2 z-50 -translate-y-1/2 transition-all duration-200',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      )}
      aria-hidden={!visible}
    >
      <div
        ref={(node) => {
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        data-widget-delete-zone="true"
        className={cn(
          'pointer-events-auto flex w-[120px] flex-col items-center gap-3 rounded-[28px] border px-4 py-5 shadow-lg transition-all duration-200',
          highlighted
            ? 'scale-[1.04] border-red-800 bg-red-700 text-white shadow-red-500/50'
            : 'border-red-700 bg-red-600 text-white shadow-red-400/35'
        )}
      >
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200',
            highlighted
              ? 'scale-110 border-white/40 bg-white/18 text-white'
              : 'border-white/30 bg-white/12 text-white'
          )}
        >
          <Trash2 size={22} />
        </div>
        <div className="min-w-0 text-center">
          <div className="text-sm font-semibold leading-tight">{t('delete_zone_title')}</div>
          <div className="mt-1 text-xs text-white/85">
            {t(highlighted ? 'delete_zone_active' : 'delete_zone_hint')}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WidgetDeleteZone;
