import { create } from 'zustand';

/**
 * SidebarState Interface
 * 侧边栏状态管理
 */
export interface SidebarState {
  isOpen: boolean; // 侧边栏展开/收起状态
  layoutMode: 'push' | 'overlay'; // 布局模式：push (推挤内容) | overlay (悬浮覆盖)
  selectedCategoryId: string | null; // 当前选中的分类 ID
  toggle: () => void;
  toggleLayoutMode: () => void;
  close: () => void;
  open: () => void;
  setSelectedCategoryId: (id: string | null) => void;
}

/**
 * useSidebarStore
 * 控制侧边栏的显示、布局模式及分类选中状态
 */
export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  layoutMode: 'push', // 默认为 push 模式
  selectedCategoryId: null,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  // 切换布局模式
  toggleLayoutMode: () => set((state) => ({ layoutMode: state.layoutMode === 'push' ? 'overlay' : 'push' })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
