"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import ClockWidget from '../widgets/ClockWidget';
import WeatherWidget from '../widgets/WeatherWidget';
import DateWidget from '../widgets/DateWidget';
import QuickLinkWidget from '../widgets/QuickLinkWidget';
import TodoWidget from '../widgets/TodoWidget';
import MemoWidget from '../widgets/MemoWidget';
import CalendarWidget from '../widgets/CalendarWidget';
import PhotoWidget from '../widgets/PhotoWidget';
import WidgetPicker from '../widgets/WidgetPicker';
import WidgetSettingsModal from '../widgets/WidgetSettingsModal';
import { Trash2, GripHorizontal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

import GridLayout, { Layout, LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * useContainerWidth Hook
 * 监听容器宽度变化，用于响应式网格布局
 * 使用 ResizeObserver 实现高性能监听
 */
const useContainerWidth = () => {
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

  return { width, containerRef };
};

/**
 * WidgetItemContent Component
 * 小组件容器封装，处理编辑模式下的拖拽手柄和操作按钮
 */
const WidgetItemContent = React.memo(({ widget, onEdit }: { widget: Widget; onEdit: (widget: Widget) => void }) => {
  const { removeWidget } = useWidgetStore();
  const { isEditing } = useUIStore();
  const t = useTranslations('Widgets');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const renderContent = () => {
    switch (widget.type) {
      case 'clock':
        return <ClockWidget widget={widget} />;
      case 'weather':
        return <WeatherWidget widget={widget} />;
      case 'date':
        return <DateWidget widget={widget} />;
      case 'quick-link':
        return <QuickLinkWidget widget={widget} />;
      case 'todo':
        return <TodoWidget widget={widget} />;
      case 'memo':
        return <MemoWidget widget={widget} />;
      case 'calendar':
        return <CalendarWidget widget={widget} />;
      case 'photo-frame':
        return <PhotoWidget widget={widget} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-xs font-bold uppercase text-gray-400 mb-2">{widget.type}</span>
            <div className="text-gray-600 font-medium">{t('coming_soon')}</div>
          </div>
        );
    }
  };

  const isTransparent = !isEditing && widget.type === 'clock' && widget.config?.clockStyle === 'analog';

  return (
    <div className="w-full h-full relative group">
      {/* 编辑模式下的覆盖层：显示删除/设置按钮和拖拽手柄 */}
      {isEditing && (
        <>
          <div className="absolute top-2 right-2 flex space-x-1 z-20 animate-in fade-in zoom-in duration-200">
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEdit(widget); }}
              className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
              title={t('edit_widget')}
              aria-label={t('edit_widget')}
            >
              <Settings size={14} />
            </button>
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
              className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
              title={t('remove_widget')}
              aria-label={t('remove_widget')}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="absolute top-2 left-2 z-10 text-gray-400 cursor-grab active:cursor-grabbing draggable-handle bg-white/50 p-1 rounded-md backdrop-blur-sm" aria-hidden="true">
             <GripHorizontal size={16} />
          </div>
        </>
      )}
      
      <div className={cn(
        "w-full h-full transition-all duration-200",
        isEditing 
          ? "overflow-hidden rounded-xl border border-blue-400 border-dashed ring-4 ring-blue-50 bg-gray-50/50 scale-[0.98]" 
          : isTransparent
            ? ""
            : "overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md"
      )}>
        <div className={cn("w-full h-full", isEditing && "pointer-events-none opacity-80 blur-[0.5px]")}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
});
WidgetItemContent.displayName = 'WidgetItemContent';

/**
 * MainCanvas Component
 * 主内容区域，基于 react-grid-layout 实现可拖拽、可缩放的网格布局
 */
export default function MainCanvas() {
  const { 
    backgroundImage, 
    backgroundBlur, 
    backgroundOpacity,
    backgroundSize,
    backgroundRepeat
  } = useSettingsStore();
  const { widgets, setWidgets } = useWidgetStore();
  const { isEditing, isWidgetPickerOpen, closeWidgetPicker } = useUIStore();
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // 获取容器宽度以动态调整网格列数
  const { width, containerRef } = useContainerWidth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据容器宽度计算当前列数 (响应式断点)
  const currentCols = useMemo(() => {
    if (!width) return 6;
    if (width >= 1200) return 6;
    if (width >= 996) return 4;
    if (width >= 768) return 3;
    if (width >= 480) return 2;
    return 1;
  }, [width]);

  // 生成 react-grid-layout 所需的布局配置
  const layout = useMemo<Layout>(() => {
    return widgets.map<LayoutItem>((widget) => ({
      i: widget.id,
      x: widget.position?.x ?? 0,
      y: widget.position?.y ?? Infinity,
      w: widget.size.w,
      h: widget.size.h,
      isDraggable: isEditing,
      isResizable: isEditing,
    }));
  }, [widgets, isEditing]);

  // 布局变更回调：更新小组件的位置和尺寸
  const onLayoutChange = useCallback((layout: Layout) => {
    if (!isEditing) return;
    const hasChanged = layout.some(l => {
      const w = widgets.find(w => w.id === l.i);
      if (!w) return false;
      return w.position.x !== l.x || w.position.y !== l.y || w.size.w !== l.w || w.size.h !== l.h;
    });

    if (hasChanged) {
      const newWidgets = widgets.map(w => {
        const l = layout.find(item => item.i === w.id);
        if (l) {
          return {
            ...w,
            position: { x: l.x, y: l.y },
            size: { w: l.w, h: l.h }
          };
        }
        return w;
      });
      setWidgets(newWidgets);
    }
  }, [widgets, setWidgets, isEditing]);

  return (
    <main className="flex-1 relative flex flex-col overflow-hidden">
      <>
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: (backgroundImage && (backgroundImage.startsWith('http') || backgroundImage.startsWith('/') || backgroundImage.startsWith('data:')))
              ? `url(${backgroundImage})` 
              : (backgroundImage || 'radial-gradient(#d1d5db 2px, transparent 2px)'),
            backgroundSize: backgroundImage ? (backgroundSize || 'cover') : '24px 24px',
            backgroundRepeat: backgroundImage ? (backgroundRepeat || 'no-repeat') : 'repeat',
            backgroundPosition: 'center',
            filter: `blur(${backgroundBlur}px)`,
          }}
        />
        <div 
          className="absolute inset-0 z-0 pointer-events-none bg-black"
          style={{ opacity: backgroundOpacity }}
        />
      </>

      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <div ref={containerRef} className="max-w-7xl mx-auto min-h-[500px]">
         {mounted && width > 0 && (
           <GridLayout
            className="layout"
            layout={layout}
            width={width}
            gridConfig={{
              cols: currentCols,
              rowHeight: 150,
              margin: [16, 16],
            }}
            dragConfig={{
              enabled: isEditing,
              handle: ".draggable-handle",
            }}
            resizeConfig={{
              enabled: isEditing,
            }}
            onLayoutChange={onLayoutChange}
          >
             {widgets.map((widget) => (
               <div key={widget.id}>
                 <WidgetItemContent widget={widget} onEdit={setEditingWidget} />
               </div>
             ))}
           </GridLayout>
         )}

         {/* Add Widget Button moved to Header */}
        </div>
      </div>
      
      <WidgetPicker 
        isOpen={isWidgetPickerOpen} 
        onClose={closeWidgetPicker} 
      />
      <WidgetSettingsModal 
        isOpen={!!editingWidget} 
        widget={editingWidget} 
        onClose={() => setEditingWidget(null)} 
      />
    </main>
  );
}
