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

  const isTransparent =
    !canEdit &&
    widget.type === 'clock' &&
    false;

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
              className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
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
              className="p-1.5 rounded-full border border-red-100 bg-red-50 text-red-600 shadow-sm hover:bg-red-100 hover:text-red-700 transition-colors"
              title={t('remove_widget')}
              aria-label={t('remove_widget')}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div
            className="absolute top-2 left-2 z-10 text-gray-600 cursor-grab active:cursor-grabbing draggable-handle bg-white/90 p-1.5 rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-150 touch-none select-none"
            aria-hidden="true"
            onPointerDown={(event) => onDragHandlePointerDown(widget, event)}
          >
            <GripHorizontal size={18} />
          </div>
        </>
      )}

      <div
        className={cn(
          'w-full h-full transition-all duration-300',
          canEdit
            ? 'overflow-hidden rounded-xl border border-blue-400 border-dashed ring-4 ring-blue-50 bg-gray-50/50 scale-[0.98]'
            : isTransparent
              ? ''
              : 'overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md'
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
  onEdit,
  onDragHandlePointerDown,
}: CanvasWidgetItemProps) {
  const { isEditing } = useUIStore();
  const canEdit = isEditing;

  return (
    <>
      {canEdit && hasPreviewTarget && (
        <div
          className="absolute z-10 pointer-events-none rounded-2xl border border-blue-300/80 border-dashed bg-blue-100/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] transition-[left,top,width,height,opacity] duration-200 ease-out"
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
