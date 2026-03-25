'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  rectIntersection,
  DragMoveEvent,
  Modifier,
} from '@dnd-kit/core';
import { Coordinates } from '@dnd-kit/utilities';
import { WidgetDropDetail } from '@/lib/widgetPlacement';
import { useSidebarStore } from '@/store/useSidebarStore';

// 拖拽数据的类型定义
export interface DragData {
  type: string;
  defaultSize: { w: number; h: number };
  titleKey: string;
  descKey: string;
}

// 拖拽上下文的类型
interface DragDropContextType {
  activeDragData: DragData | null;
  dragOverlayPosition: Coordinates | null;
  isDragging: boolean;
}

const DragDropContext = createContext<DragDropContextType>({
  activeDragData: null,
  dragOverlayPosition: null,
  isDragging: false,
});

interface DragDropProviderProps {
  children: ReactNode;
}

function getClientFromEvent(event: Event | undefined): { x: number; y: number } | null {
  if (!event) return null;

  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY };
  }

  if (event instanceof TouchEvent) {
    const touch = event.changedTouches[0] || event.touches[0];
    if (touch) {
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  return null;
}

function getClientFromActiveRect(activeRect: DragEndEvent['active']['rect']): { x: number; y: number } | null {
  const translated = activeRect.current.translated;
  if (!translated) return null;
  return {
    x: translated.left + translated.width / 2,
    y: translated.top + translated.height / 2,
  };
}

/**
 * DragDropProvider
 * 提供全局拖拽上下文，管理侧边栏到主画布的拖拽功能
 */
export default function DragDropProvider({ children }: DragDropProviderProps) {
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [dragOverlayPosition, setDragOverlayPosition] = useState<Coordinates | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPointerClientRef = useRef<{ x: number; y: number } | null>(null);
  const smoothTransformRef = useRef<{ x: number; y: number } | null>(null);
  const { close: closeSidebar } = useSidebarStore();

  const dragLagModifier: Modifier = useCallback(({ transform }) => {
    const prev = smoothTransformRef.current;
    if (!prev) {
      smoothTransformRef.current = { x: transform.x, y: transform.y };
      return transform;
    }

    // 低通滤波：让卡片跟随略有迟滞，避免“过快直跟手”
    const nextX = prev.x + (transform.x - prev.x) * 0.35;
    const nextY = prev.y + (transform.y - prev.y) * 0.35;
    smoothTransformRef.current = { x: nextX, y: nextY };

    return {
      ...transform,
      x: nextX,
      y: nextY,
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      lastPointerClientRef.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [isDragging]);

  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移动8px才开始拖拽，避免误触
      },
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current as DragData;

    if (dragData) {
      setActiveDragData(dragData);
      setIsDragging(true);
      smoothTransformRef.current = null;
      lastPointerClientRef.current = getClientFromEvent(event.activatorEvent);
      // 拖拽开始即自动收起组件商店，释放主面板操作空间
      closeSidebar();
    }
  }, [closeSidebar]);

  // 拖拽移动
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (event.delta) {
      setDragOverlayPosition(event.delta);
    }
    const currentClient = getClientFromEvent(event.activatorEvent);
    if (currentClient) {
      lastPointerClientRef.current = currentClient;
    }
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    // 重置状态
    setActiveDragData(null);
    setDragOverlayPosition(null);
    setIsDragging(false);

    const dragData = active.data.current as DragData | undefined;
    if (!dragData) {
      lastPointerClientRef.current = null;
      return;
    }

    const dropClient =
      lastPointerClientRef.current ??
      getClientFromActiveRect(active.rect) ??
      getClientFromEvent(event.activatorEvent);

    const droppedByOver = over?.id === 'main-canvas-drop-area';
    let droppedByRect = false;
    const dropArea = document.querySelector('[data-grid-drop-area="true"]');
    if (dropClient && dropArea instanceof HTMLElement) {
      const rect = dropArea.getBoundingClientRect();
      droppedByRect =
        dropClient.x >= rect.left &&
        dropClient.x <= rect.right &&
        dropClient.y >= rect.top &&
        dropClient.y <= rect.bottom;
    }
    const droppedOnGrid = droppedByOver || droppedByRect;

    // 无论是否命中网格都派发：未命中时由主面板回退到末尾空白位
    const dropEvent = new CustomEvent<WidgetDropDetail>('widget-drop', {
        detail: {
          widgetType: dragData.type,
          defaultSize: dragData.defaultSize,
          gridPosition: undefined,
          dropClient,
          droppedOnGrid,
        },
    });
    window.dispatchEvent(dropEvent);
    lastPointerClientRef.current = null;
    smoothTransformRef.current = null;
  }, []);

  // 拖拽取消
  const handleDragCancel = useCallback(() => {
    setActiveDragData(null);
    setDragOverlayPosition(null);
    setIsDragging(false);
    lastPointerClientRef.current = null;
    smoothTransformRef.current = null;
  }, []);

  return (
    <DragDropContext.Provider value={{ activeDragData, dragOverlayPosition, isDragging }}>
      <DndContext
        sensors={sensors}
        modifiers={[dragLagModifier]}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* 拖拽覆盖层 */}
        <DragOverlay dropAnimation={null}>
          {activeDragData && (
            <div className="p-3 bg-white border border-blue-300 rounded-xl shadow-lg flex items-center space-x-3 opacity-90 will-change-transform">
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 flex items-center justify-center text-blue-600 font-bold">
                  {activeDragData.type.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-800">
                  {activeDragData.titleKey}
                </div>
                <div className="text-xs text-gray-500">
                  {activeDragData.descKey}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
}

// 使用拖拽上下文的Hook
export function useDragDrop() {
  return useContext(DragDropContext);
}
