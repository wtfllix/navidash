import { create } from 'zustand';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, Settings } from '@/types';
import {
  createDefaultSettings,
  normalizeSettings,
  SettingsSchema,
  SettingsStorePersistedStateSchema,
} from '@/lib/schemas';
import { DEMO_DATA_VERSION, DEMO_SETTINGS, isClientDemoMode } from '@/lib/demo';

interface SettingsState extends Settings {
  setBackgroundImage: (url: string) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundSize: (size: string) => void;
  setBackgroundRepeat: (repeat: string) => void;
  setThemeColor: (color: string) => void;
  setCustomFavicon: (url: string) => void;
  setCustomTitle: (title: string) => void;
  setLanguage: (lang: string) => void;
  isSavingSettings: boolean;
  hasFetchedSettings: boolean;
  resetSettings: () => void;
  fetchSettings: (force?: boolean) => Promise<void>;
  dataVersion?: number;
}

const persistKey = 'settings-storage';

const memoryOnlyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function extractSettings(state: Settings): Settings {
  return {
    backgroundImage: state.backgroundImage,
    backgroundBlur: state.backgroundBlur,
    backgroundOpacity: state.backgroundOpacity,
    backgroundSize: state.backgroundSize,
    backgroundRepeat: state.backgroundRepeat,
    themeColor: state.themeColor,
    customFavicon: state.customFavicon,
    customTitle: state.customTitle,
    language: state.language,
  };
}

function parseServerVersion(value: unknown): number | undefined {
  const version = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(version) && version >= 0 ? version : undefined;
}

let saveTimeout: NodeJS.Timeout | null = null;

const saveToServer = (settings: Settings) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  useSettingsStore.setState({ isSavingSettings: true });
  const payload = SettingsSchema.parse(settings);

  saveTimeout = setTimeout(async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to save settings: ${res.status}`);
      }

      const data = await res.json();
      const version = parseServerVersion(data?.version);

      if (version !== undefined) {
        useSettingsStore.setState({ dataVersion: version });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      useSettingsStore.setState({ isSavingSettings: false });
      saveTimeout = null;
    }
  }, 1000);
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => {
      const updateSettings = (patch: Partial<Settings>) =>
        set((state) => {
          const nextSettings = normalizeSettings({
            ...extractSettings(state),
            ...patch,
          });

          if (state.hasFetchedSettings && !isClientDemoMode) {
            saveToServer(nextSettings);
          }

          return {
            ...nextSettings,
            hasFetchedSettings: state.hasFetchedSettings,
          };
        });

      return {
        ...(isClientDemoMode ? DEMO_SETTINGS : DEFAULT_SETTINGS),
        isSavingSettings: false,
        hasFetchedSettings: false,
        fetchSettings: async (force = false) => {
          if (isClientDemoMode) {
            if ((get().dataVersion ?? 0) !== DEMO_DATA_VERSION) {
              set({
                ...DEMO_SETTINGS,
                dataVersion: DEMO_DATA_VERSION,
                hasFetchedSettings: true,
                isSavingSettings: false,
              });
            } else if (!get().hasFetchedSettings) {
              set({ hasFetchedSettings: true });
            }
            return;
          }

          try {
            if (get().isSavingSettings) {
              return;
            }

            const res = await fetch(`/api/settings?t=${Date.now()}`, {
              cache: 'no-store',
            });

            if (!res.ok) {
              throw new Error(`Failed to fetch settings: ${res.status}`);
            }

            const serverVersion = parseServerVersion(res.headers.get('X-Data-Version')) ?? 0;
            const currentVersion = get().dataVersion ?? 0;

            if (force || serverVersion !== currentVersion) {
              const data = await res.json();
              const settings = normalizeSettings(data);
              set({ ...settings, dataVersion: serverVersion, hasFetchedSettings: true });
            } else {
              set({ hasFetchedSettings: true });
            }
          } catch (error) {
            console.error('Failed to fetch settings:', error);
          }
        },
        setBackgroundImage: (backgroundImage) => updateSettings({ backgroundImage }),
        setBackgroundBlur: (backgroundBlur) => updateSettings({ backgroundBlur }),
        setBackgroundOpacity: (backgroundOpacity) => updateSettings({ backgroundOpacity }),
        setBackgroundSize: (backgroundSize) => updateSettings({ backgroundSize }),
        setBackgroundRepeat: (backgroundRepeat) => updateSettings({ backgroundRepeat }),
        setThemeColor: (themeColor) => updateSettings({ themeColor }),
        setCustomFavicon: (customFavicon) => updateSettings({ customFavicon }),
        setCustomTitle: (customTitle) => updateSettings({ customTitle }),
        setLanguage: (language) => updateSettings({ language }),
        resetSettings: () => {
          if (isClientDemoMode) {
            set({
              ...DEMO_SETTINGS,
              isSavingSettings: false,
              hasFetchedSettings: true,
              dataVersion: DEMO_DATA_VERSION,
            });
            return;
          }

          const defaults = createDefaultSettings();
          set({ ...defaults, isSavingSettings: false, hasFetchedSettings: true });
          saveToServer(defaults);
        },
      };
    },
    {
      name: persistKey,
      storage: createJSONStorage(() => (isClientDemoMode ? memoryOnlyStorage : localStorage)),
      partialize: (state) => ({
        ...extractSettings(state),
        dataVersion: state.dataVersion,
      }),
      merge: (persistedState, currentState) => {
        const parsed = SettingsStorePersistedStateSchema.safeParse(persistedState);

        if (!parsed.success) {
          return currentState;
        }

        return {
          ...currentState,
          ...normalizeSettings(parsed.data, extractSettings(currentState)),
          isSavingSettings: currentState.isSavingSettings,
          hasFetchedSettings: currentState.hasFetchedSettings,
          dataVersion: parsed.data.dataVersion,
        };
      },
    }
  )
);
