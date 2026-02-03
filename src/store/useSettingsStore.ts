import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  backgroundImage: string;
  backgroundBlur: number;
  backgroundOpacity: number;
  backgroundSize: string;
  backgroundRepeat: string;
  themeColor: string;
  customFavicon: string;
  customTitle: string;
  
  setBackgroundImage: (url: string) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundSize: (size: string) => void;
  setBackgroundRepeat: (repeat: string) => void;
  setThemeColor: (color: string) => void;
  setCustomFavicon: (url: string) => void;
  setCustomTitle: (title: string) => void;
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
      themeColor: '#3b82f6', // blue-500
      customFavicon: '/favicon.svg',
      customTitle: 'Navidash',

      setBackgroundImage: (url) => set({ backgroundImage: url }),
      setBackgroundBlur: (blur) => set({ backgroundBlur: blur }),
      setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
      setBackgroundSize: (size) => set({ backgroundSize: size }),
      setBackgroundRepeat: (repeat) => set({ backgroundRepeat: repeat }),
      setThemeColor: (color) => set({ themeColor: color }),
      setCustomFavicon: (url) => set({ customFavicon: url }),
      setCustomTitle: (title) => set({ customTitle: title }),
      resetSettings: () => set({
        backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
        backgroundBlur: 0,
        backgroundOpacity: 0,
        backgroundSize: '24px 24px',
        backgroundRepeat: 'repeat',
        themeColor: '#3b82f6',
        customFavicon: '/favicon.svg',
        customTitle: 'Navidash'
      })
    }),
    {
      name: 'settings-storage',
    }
  )
);
