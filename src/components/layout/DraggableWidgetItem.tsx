'use client';

import React, { useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import { WidgetMeta } from '@/components/widgets/registry';

interface DraggableWidgetItemProps {
  meta: WidgetMeta;
  onClick?: () => void;
}

/**
 * DraggableWidgetItem
 * 可拖拽的小组件项，用于侧边栏小组件商店
 */
export default function DraggableWidgetItem({ meta, onClick }: DraggableWidgetItemProps) {
  const t = useTranslations('Widgets');
  const justDraggedRef = useRef(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `widget-draggable-${meta.type}`,
    data: {
      type: meta.type,
      defaultSize: meta.defaultSize,
      titleKey: meta.titleKey,
      descKey: meta.descKey,
    } as any,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  useEffect(() => {
    if (isDragging) {
      justDraggedRef.current = true;
    }
  }, [isDragging]);

  const handleClick = (e: React.MouseEvent) => {
    // 拖拽结束后浏览器可能仍触发 click，需忽略避免重复添加
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
      return;
    }

    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        flex items-start p-3 rounded-xl border
        bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 group
        transition-all duration-150
        ${isDragging
          ? 'border-blue-400 shadow-lg scale-105 z-50'
          : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
        }
      `}
      aria-label={`添加 ${t(meta.titleKey as any)}`}
    >
      <div className={`
        flex-shrink-0 p-2 rounded-xl mr-3 ring-1
        transition-colors duration-150
        ${isDragging
          ? 'bg-blue-100 ring-blue-200'
          : 'bg-gray-50 ring-gray-100 group-hover:bg-blue-50 group-hover:ring-blue-100'
        }
      `}>
        <meta.Icon size={24} className={meta.iconClassName} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`
          font-semibold text-sm mb-1 transition-colors duration-150
          ${isDragging ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'}
        `}>
          {t(meta.titleKey as any)}
        </h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          {t(meta.descKey as any)}
        </p>
        <div className="mt-2 text-xs text-gray-400">
          默认尺寸: {meta.defaultSize.w} × {meta.defaultSize.h}
        </div>
      </div>
    </button>
  );
}
