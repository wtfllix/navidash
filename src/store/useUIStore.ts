import { create } from 'zustand';
import { WidgetLayoutMode } from '@/types';

/**
 * UIState Interface
 * 全局 UI 状态管理
 */
interface UIState {
  isOnboardingOpen: boolean;
  setOnboardingOpen: (isOpen: boolean) => void;
  isEditing: boolean; // 是否处于编辑模式（控制拖拽和编辑按钮显示）
  toggleEditing: () => void;
  setEditing: (isEditing: boolean) => void;
  currentCanvasCols: number;
  setCurrentCanvasCols: (cols: number) => void;
  editingLayoutMode: WidgetLayoutMode;
  setEditingLayoutMode: (mode: WidgetLayoutMode) => void;
  isLauncherOpen: boolean;
  openLauncher: () => void;
  closeLauncher: () => void;
  isBookmarksOpen: boolean;
  openBookmarks: () => void;
  closeBookmarks: () => void;
  toggleBookmarks: () => void;
  isSettingsOpen: boolean; // 全局设置模态框状态
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

/**
 * useUIStore
 * 集中管理应用的 UI 交互状态
 */
export const useUIStore = create<UIState>((set) => ({
  isOnboardingOpen: false,
  setOnboardingOpen: (isOnboardingOpen) => set({ isOnboardingOpen }),
  isEditing: false,
  toggleEditing: () =>
    set((state) => ({
      isEditing: !state.isEditing,
      isBookmarksOpen: false,
    })),
  setEditing: (isEditing) => set({ isEditing }),
  currentCanvasCols: 8,
  setCurrentCanvasCols: (currentCanvasCols) => set({ currentCanvasCols }),
  editingLayoutMode: 'desktop',
  setEditingLayoutMode: (editingLayoutMode) => set({ editingLayoutMode }),
  isLauncherOpen: false,
  openLauncher: () => set({ isLauncherOpen: true, isBookmarksOpen: false }),
  closeLauncher: () => set({ isLauncherOpen: false }),
  isBookmarksOpen: false,
  openBookmarks: () => set({ isBookmarksOpen: true, isLauncherOpen: false }),
  closeBookmarks: () => set({ isBookmarksOpen: false }),
  toggleBookmarks: () =>
    set((state) => ({
      isBookmarksOpen: !state.isBookmarksOpen,
      isLauncherOpen: false,
    })),
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true, isBookmarksOpen: false }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
