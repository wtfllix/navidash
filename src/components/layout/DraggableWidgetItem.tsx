'use client';

import React, { useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import { WidgetMeta } from '@/components/widgets/registry';

interface DraggableWidgetItemProps {
  meta: WidgetMeta;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * DraggableWidgetItem
 * 可拖拽的小组件项，用于侧边栏小组件商店
 */
export default function DraggableWidgetItem({
  meta,
  onClick,
  disabled = false,
}: DraggableWidgetItemProps) {
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
    cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
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
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      onClick={handleClick}
      disabled={disabled}
      className={`
        flex items-start rounded-2xl border bg-white p-3.5
        text-left focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary-color),0.22)] group
        transition-all duration-150
        ${isDragging
          ? 'border-[rgba(var(--primary-color),0.5)] shadow-lg shadow-slate-900/10 scale-[1.03] z-50'
          : disabled
            ? 'border-slate-200 opacity-65'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
        }
      `}
      aria-label={`${t('click_to_add')} ${t(meta.titleKey as any)}`}
    >
      <div className={`
        mr-3 flex-shrink-0 rounded-2xl p-2.5 ring-1
        transition-colors duration-150
        ${isDragging
          ? 'bg-[rgba(var(--primary-color),0.12)] ring-[rgba(var(--primary-color),0.16)]'
          : 'bg-slate-50 ring-slate-100 group-hover:bg-[rgba(var(--primary-color),0.08)] group-hover:ring-[rgba(var(--primary-color),0.12)]'
        }
      `}>
        <meta.Icon size={24} className={meta.iconClassName} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`
          mb-1 text-sm font-semibold transition-colors duration-150
          ${isDragging ? 'text-[rgb(var(--primary-color))]' : 'text-slate-800 group-hover:text-slate-900'}
        `}>
          {t(meta.titleKey as any)}
        </h4>
        <p className="text-xs leading-relaxed text-slate-500">
          {t(meta.descKey as any)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
            {t('default_size')}: {meta.defaultSize.w} × {meta.defaultSize.h}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-300">
            {t('drag_hint')}
          </span>
        </div>
      </div>
    </button>
  );
}
