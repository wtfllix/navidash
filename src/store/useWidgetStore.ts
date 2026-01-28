import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Widget } from '@/types';

interface WidgetState {
  widgets: Widget[];
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, data: Partial<Widget>) => void;
  setWidgets: (widgets: Widget[]) => void;
  fetchWidgets: () => Promise<void>;
}

const initialWidgets: Widget[] = [
  {
    id: '1',
    type: 'clock',
    size: { w: 2, h: 1 },
    position: { x: 0, y: 0 },
    config: {},
  },
  {
    id: '2',
    type: 'weather',
    size: { w: 2, h: 1 },
    position: { x: 2, y: 0 },
    config: { city: 'Shanghai' },
  },
  {
    id: '3',
    type: 'calendar',
    size: { w: 2, h: 2 },
    position: { x: 4, y: 0 },
    config: {},
  },
  {
    id: '4',
    type: 'memo',
    size: { w: 2, h: 2 },
    position: { x: 0, y: 2 },
    config: { text: '欢迎使用 NaviDash Demo！这里是备忘录示例。' },
  },
  {
    id: '5',
    type: 'todo',
    size: { w: 2, h: 2 },
    position: { x: 2, y: 2 },
    config: { items: [{ id: 't1', text: '探索侧边栏与书签', done: false }, { id: 't2', text: '添加一个新组件', done: false }] },
  },
];

import { useToastStore } from '@/store/useToastStore';

/**
 * saveToServer
 * 将小组件配置持久化到服务器
 */
const saveToServer = async (widgets: Widget[]): Promise<boolean> => {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    useToastStore.getState().addToast('Demo Mode: Changes are temporary and will reset on refresh', 'info');
    return true; // Pretend success so no rollback happens
  }
  try {
    const res = await fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widgets),
    });
    if (!res.ok) {
        throw new Error(`Failed to save widgets: ${res.status} ${res.statusText}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to save widgets:', error);
    return false;
  }
};

/**
 * useWidgetStore
 * 小组件状态管理 Hook，使用 Zustand + Persist 中间件
 */
export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: initialWidgets,
      // 从服务器获取小组件数据
      fetchWidgets: async () => {
        try {
          const res = await fetch('/api/widgets');
          if (res.ok) {
            const data = await res.json();
            // 只有当服务器返回了非空数据时，才覆盖本地数据
            // 兼容 Demo 模式下的初始状态
            if (data && Array.isArray(data) && data.length > 0) {
              set({ widgets: data });
            } else {
              // 如果服务器没有数据，且本地也没有数据（可能被错误清空），则恢复默认演示数据
              const currentWidgets = get().widgets;
              if (!currentWidgets || currentWidgets.length === 0) {
                set({ widgets: initialWidgets });
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch widgets:', error);
        }
      },
      addWidget: (widget) => {
          const previousWidgets = get().widgets;
          const newWidgets = [...previousWidgets, widget];
          set({ widgets: newWidgets }); // Optimistic update
          
          saveToServer(newWidgets).then(success => {
              if (!success) {
                  set({ widgets: previousWidgets }); // Rollback
                  console.error('Rollback: Failed to save to server (Demo Mode?)');
              }
          });
      },
      removeWidget: (id) => {
          const previousWidgets = get().widgets;
          const newWidgets = previousWidgets.filter((w) => w.id !== id);
          set({ widgets: newWidgets }); // Optimistic update
          
          saveToServer(newWidgets).then(success => {
              if (!success) {
                  set({ widgets: previousWidgets }); // Rollback
                  console.error('Rollback: Failed to save to server (Demo Mode?)');
              }
          });
      },
      updateWidget: (id, data) => {
          const previousWidgets = get().widgets;
          const newWidgets = previousWidgets.map((w) => (w.id === id ? { ...w, ...data } : w));
          set({ widgets: newWidgets }); // Optimistic update
          
          saveToServer(newWidgets).then(success => {
              if (!success) {
                  set({ widgets: previousWidgets }); // Rollback
                  console.error('Rollback: Failed to save to server (Demo Mode?)');
              }
          });
      },
      setWidgets: (widgets) => {
        saveToServer(widgets);
        set({ widgets });
      },
    }),
    {
      name: 'widget-storage-v3', // LocalStorage Key
    }
  )
);
