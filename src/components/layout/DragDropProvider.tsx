'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
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
  pointerWithin,
  DragMoveEvent,
} from '@dnd-kit/core';
import { Coordinates } from '@dnd-kit/utilities';
import { WidgetDropDetail } from '@/lib/widgetPlacement';

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

/**
 * DragDropProvider
 * 提供全局拖拽上下文，管理侧边栏到主画布的拖拽功能
 */
export default function DragDropProvider({ children }: DragDropProviderProps) {
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [dragOverlayPosition, setDragOverlayPosition] = useState<Coordinates | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPointerClientRef = useRef<{ x: number; y: number } | null>(null);

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
      lastPointerClientRef.current = getClientFromEvent(event.activatorEvent);
    }
  }, []);

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

    // 仅当拖拽到主画布可放置区域时才触发新增
    if (over?.data.current && (over.data.current as { type?: string }).type === 'grid-drop-area') {
      const dragData = active.data.current as DragData;
      const dropData = over.data.current as { type: string; gridPosition?: { x: number; y: number } };
      const dropClient = lastPointerClientRef.current ?? getClientFromEvent(event.activatorEvent);

      // 触发放置事件
      const dropEvent = new CustomEvent<WidgetDropDetail>('widget-drop', {
        detail: {
          widgetType: dragData.type,
          defaultSize: dragData.defaultSize,
          gridPosition: dropData?.gridPosition,
          dropClient,
        },
      });
      window.dispatchEvent(dropEvent);
    }
    lastPointerClientRef.current = null;
  }, []);

  // 拖拽取消
  const handleDragCancel = useCallback(() => {
    setActiveDragData(null);
    setDragOverlayPosition(null);
    setIsDragging(false);
    lastPointerClientRef.current = null;
  }, []);

  return (
    <DragDropContext.Provider value={{ activeDragData, dragOverlayPosition, isDragging }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeDragData && (
            <div className="p-3 bg-white border border-blue-300 rounded-xl shadow-lg flex items-center space-x-3 opacity-90">
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
