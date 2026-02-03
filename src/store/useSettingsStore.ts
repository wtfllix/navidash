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
  language: string;
  
  setBackgroundImage: (url: string) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundSize: (size: string) => void;
  setBackgroundRepeat: (repeat: string) => void;
  setThemeColor: (color: string) => void;
  setCustomFavicon: (url: string) => void;
  setCustomTitle: (title: string) => void;
  setLanguage: (lang: string) => void;
  resetSettings: () => void;
  fetchSettings: () => Promise<void>;
}

/**
 * saveToServer
 * 将设置数据持久化到服务器
 */
let saveTimeout: NodeJS.Timeout | null = null;

const saveToServer = (settings: SettingsState) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      // Extract only data properties
      const {
        backgroundImage,
        backgroundBlur,
        backgroundOpacity,
        backgroundSize,
        backgroundRepeat,
        themeColor,
        customFavicon,
        customTitle
      } = settings;

      const payload = {
        backgroundImage,
        backgroundBlur,
        backgroundOpacity,
        backgroundSize,
        backgroundRepeat,
        themeColor,
        customFavicon,
        customTitle
      };

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      saveTimeout = null;
    }
  }, 1000); // 1秒防抖
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
      backgroundBlur: 0,
      backgroundOpacity: 0,
      backgroundSize: '24px 24px',
      backgroundRepeat: 'repeat',
      themeColor: '#3b82f6', // blue-500
      customFavicon: '/favicon.svg',
      customTitle: 'Navidash',

      fetchSettings: async () => {
        try {
          const res = await fetch(`/api/settings?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (data && Object.keys(data).length > 0) {
              set(data);
            }
          }
        } catch (error) {
          console.error('Failed to fetch settings:', error);
        }
      },

      setBackgroundImage: (url) => {
        set({ backgroundImage: url });
        saveToServer(get());
      },
      setBackgroundBlur: (blur) => {
        set({ backgroundBlur: blur });
        saveToServer(get());
      },
      setBackgroundOpacity: (opacity) => {
        set({ backgroundOpacity: opacity });
        saveToServer(get());
      },
      setBackgroundSize: (size) => {
        set({ backgroundSize: size });
        saveToServer(get());
      },
      setBackgroundRepeat: (repeat) => {
        set({ backgroundRepeat: repeat });
        saveToServer(get());
      },
      setThemeColor: (color) => {
        set({ themeColor: color });
        saveToServer(get());
      },
      setCustomFavicon: (url) => {
        set({ customFavicon: url });
        saveToServer(get());
      },
      setCustomTitle: (title) => {
        set({ customTitle: title });
        saveToServer(get());
      },
      setLanguage: (lang) => {
        set({ language: lang });
        saveToServer(get());
      },
      resetSettings: () => {
        const defaults = {
          backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
          backgroundBlur: 0,
          backgroundOpacity: 0,
          backgroundSize: '24px 24px',
          backgroundRepeat: 'repeat',
          themeColor: '#3b82f6',
          customFavicon: '/favicon.svg',
          customTitle: 'Navidash',
          language: 'en'
        };
        set(defaults);
        saveToServer(get());
      }
    }),
    {
      name: 'settings-storage',
    }
  )
);
