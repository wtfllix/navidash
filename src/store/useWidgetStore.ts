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
];

/**
 * saveToServer
 * 将小组件配置持久化到服务器
 */
const saveToServer = async (widgets: Widget[]) => {
  try {
    await fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widgets),
    });
  } catch (error) {
    console.error('Failed to save widgets:', error);
  }
};

/**
 * useWidgetStore
 * 小组件状态管理 Hook，使用 Zustand + Persist 中间件
 */
export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      widgets: initialWidgets,
      // 从服务器获取小组件数据
      fetchWidgets: async () => {
        try {
          const res = await fetch('/api/widgets');
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data) && data.length > 0) {
              set({ widgets: data });
            }
          }
        } catch (error) {
          console.error('Failed to fetch widgets:', error);
        }
      },
      addWidget: (widget) =>
        set((state) => {
          const newWidgets = [...state.widgets, widget];
          saveToServer(newWidgets);
          return { widgets: newWidgets };
        }),
      removeWidget: (id) =>
        set((state) => {
          const newWidgets = state.widgets.filter((w) => w.id !== id);
          saveToServer(newWidgets);
          return { widgets: newWidgets };
        }),
      updateWidget: (id, data) =>
        set((state) => {
          const newWidgets = state.widgets.map((w) => (w.id === id ? { ...w, ...data } : w));
          saveToServer(newWidgets);
          return { widgets: newWidgets };
        }),
      setWidgets: (widgets) => {
        saveToServer(widgets);
        set({ widgets });
      },
    }),
    {
      name: 'widget-storage', // LocalStorage Key
    }
  )
);
