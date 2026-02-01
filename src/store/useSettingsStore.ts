import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  backgroundImage: string;
  backgroundBlur: number;
  backgroundOpacity: number;
  backgroundSize: string;
  backgroundRepeat: string;
  
  setBackgroundImage: (url: string) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundSize: (size: string) => void;
  setBackgroundRepeat: (repeat: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
      backgroundBlur: 0,
      backgroundOpacity: 0,
      backgroundSize: '24px 24px',
      backgroundRepeat: 'repeat',

      setBackgroundImage: (url) => set({ backgroundImage: url }),
      setBackgroundBlur: (blur) => set({ backgroundBlur: blur }),
      setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
      setBackgroundSize: (size) => set({ backgroundSize: size }),
      setBackgroundRepeat: (repeat) => set({ backgroundRepeat: repeat }),
      resetSettings: () => set({
        backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
        backgroundBlur: 0,
        backgroundOpacity: 0,
        backgroundSize: '24px 24px',
        backgroundRepeat: 'repeat'
      })
    }),
    {
      name: 'settings-storage',
    }
  )
);
