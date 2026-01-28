import { create } from 'zustand';

/**
 * UIState Interface
 * 全局 UI 状态管理
 */
interface UIState {
  isEditing: boolean; // 是否处于编辑模式（控制拖拽和编辑按钮显示）
  toggleEditing: () => void;
  setEditing: (isEditing: boolean) => void;
  isWidgetPickerOpen: boolean; // 小组件选择器模态框状态
  openWidgetPicker: () => void;
  closeWidgetPicker: () => void;
  toggleWidgetPicker: () => void;
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
  isEditing: false,
  toggleEditing: () => set((state) => ({ isEditing: !state.isEditing })),
  setEditing: (isEditing) => set({ isEditing }),
  isWidgetPickerOpen: false,
  openWidgetPicker: () => set({ isWidgetPickerOpen: true }),
  closeWidgetPicker: () => set({ isWidgetPickerOpen: false }),
  toggleWidgetPicker: () => set((state) => ({ isWidgetPickerOpen: !state.isWidgetPickerOpen })),
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
