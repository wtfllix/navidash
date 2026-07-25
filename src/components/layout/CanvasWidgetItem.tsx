'use client';

import React from 'react';
import { Trash2, GripHorizontal, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { widgetComponentRegistry } from '../widgets/registry';
import { cn } from '@/lib/utils';

interface CanvasWidgetItemProps {
  widget: Widget;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  layoutRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  dragOffset: {
    x: number;
    y: number;
  } | null;
  hasPreviewTarget: boolean;
  isDragging: boolean;
  isBeingPushed: boolean;
  isPreviewValid: boolean;
  onEdit: (widget: Widget) => void;
  onDragHandlePointerDown: (widget: Widget, event: React.PointerEvent<HTMLDivElement>) => void;
}

function WidgetItemContent({
  widget,
  onEdit,
  onDragHandlePointerDown,
}: {
  widget: Widget;
  onEdit: (widget: Widget) => void;
  onDragHandlePointerDown: (widget: Widget, event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const { removeWidget } = useWidgetStore();
  const { isEditing } = useUIStore();
  const t = useTranslations('Widgets');
  const canEdit = isEditing;
  const isPoster = widget.type === 'photo-frame';

  const renderContent = () => {
    const Component = widgetComponentRegistry[widget.type];
    if (Component) return <Component widget={widget} />;
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-xs font-bold uppercase text-gray-400 mb-2">{widget.type}</span>
        <div className="text-gray-600 font-medium">{t('coming_soon')}</div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative group">
      {canEdit && (
        <>
          <div className="absolute top-2 right-2 flex space-x-1 z-20 animate-in fade-in zoom-in duration-200">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(widget);
              }}
              className="rounded-xl bg-white/90 p-1.5 text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.10)] transition-colors hover:bg-[rgba(var(--primary-color),0.1)] hover:text-[rgb(var(--primary-color))]"
              title={t('edit_widget')}
              aria-label={t('edit_widget')}
            >
              <Settings size={14} />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeWidget(widget.id);
              }}
              className="rounded-xl bg-red-50/95 p-1.5 text-red-600 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-colors hover:bg-red-100 hover:text-red-700"
              title={t('remove_widget')}
              aria-label={t('remove_widget')}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div
            className="draggable-handle absolute left-2 top-2 z-10 cursor-grab select-none rounded-xl bg-white/90 p-1.5 text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.10)] transition-all duration-150 hover:bg-white hover:text-[rgb(var(--primary-color))] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] active:cursor-grabbing touch-none"
            aria-hidden="true"
            onPointerDown={(event) => onDragHandlePointerDown(widget, event)}
          >
            <GripHorizontal size={18} />
          </div>
        </>
      )}

      <div
        className={cn(
          'h-full w-full transition-all duration-300',
          isPoster ? 'poster-surface' : 'widget-surface',
          canEdit
            ? 'widget-surface-editing scale-[0.985]'
            : ''
        )}
      >
        <div className={cn('w-full h-full', canEdit && 'pointer-events-none opacity-80 blur-[0.5px]')}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

const MemoizedWidgetItemContent = React.memo(WidgetItemContent);
MemoizedWidgetItemContent.displayName = 'WidgetItemContent';

export default function CanvasWidgetItem({
  widget,
  rect,
  layoutRect,
  dragOffset,
  hasPreviewTarget,
  isDragging,
  isBeingPushed,
  isPreviewValid,
  onEdit,
  onDragHandlePointerDown,
}: CanvasWidgetItemProps) {
  const { isEditing } = useUIStore();
  const canEdit = isEditing;

  return (
    <>
      {canEdit && hasPreviewTarget && (
        <div
          className={cn(
            'pointer-events-none absolute z-10 rounded-[var(--radius-widget)] border border-dashed shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] transition-[left,top,width,height,opacity] duration-200 ease-out',
            isPreviewValid
              ? 'border-blue-300/80 bg-blue-100/25'
              : 'border-red-400/90 bg-red-100/35'
          )}
          style={{
            left: `${layoutRect.left}px`,
            top: `${layoutRect.top}px`,
            width: `${layoutRect.width}px`,
            height: `${layoutRect.height}px`,
          }}
        />
      )}

      <div
        className={cn(
          'absolute select-none transition-[left,top,width,height,transform,filter,opacity]',
          isDragging
            ? 'z-30 transition-none drop-shadow-2xl'
            : isBeingPushed
              ? 'duration-[430ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]'
              : 'duration-260 ease-out'
        )}
        style={{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform:
            isDragging && dragOffset
              ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.02)`
              : undefined,
          opacity: isDragging ? 0.97 : undefined,
          willChange: isDragging ? 'transform' : isBeingPushed ? 'left, top' : undefined,
        }}
      >
        <MemoizedWidgetItemContent
          widget={widget}
          onEdit={onEdit}
          onDragHandlePointerDown={onDragHandlePointerDown}
        />
      </div>
    </>
  );
}
