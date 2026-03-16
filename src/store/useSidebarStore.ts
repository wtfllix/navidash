import { create } from 'zustand';

/**
 * SidebarState Interface
 * 侧边栏状态管理（Overlay 模式，默认隐藏）
 */
export interface SidebarState {
  isOpen: boolean;
  selectedCategoryId: string | null;
  toggle: () => void;
  close: () => void;
  open: () => void;
  setSelectedCategoryId: (id: string | null) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false, // 默认收起
  selectedCategoryId: null,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
