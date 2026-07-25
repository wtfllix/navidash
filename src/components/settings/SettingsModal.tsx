'use client';

import React, { useRef, useState, useTransition } from 'react';
import {
  AlertTriangle,
  Check,
  CloudSun,
  Download,
  FileJson,
  Globe,
  LayoutTemplate,
  Palette,
  RefreshCw,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from '@/navigation';
import Modal from '@/components/ui/Modal';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToastStore } from '@/store/useToastStore';
import { useWidgetStore } from '@/store/useWidgetStore';
import { collectLauncherBookmarks } from '@/lib/linkLauncher';
import { clearLauncherHistory } from '@/lib/linkLauncherHistory';
import {
  canonicalizeLauncherUrl,
  clearLauncherLinkUsage,
  clearLauncherQueryUsage,
  clearLauncherUsage,
  LAUNCHER_USAGE_CHANGED_EVENT,
  LauncherUsageStore,
  readLauncherUsage,
  replaceLauncherUsage,
} from '@/lib/linkLauncherUsage';
import { HOMEPAGE_TEMPLATES } from '@/lib/homepageTemplates';
import { createBookmarkImportData } from '@/lib/bookmarkImport';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WeatherServiceStatus {
  provider: 'QWeather';
  configured: boolean;
  host: string;
  authType: 'apikey' | 'jwt';
  demo: boolean;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    backgroundImage,
    setBackgroundImage,
    backgroundBlur,
    setBackgroundBlur,
    backgroundOpacity,
    setBackgroundOpacity,
    backgroundSize,
    setBackgroundSize,
    backgroundRepeat,
    setBackgroundRepeat,
    customFavicon,
    setCustomFavicon,
    customTitle,
    setCustomTitle,
    setLanguage,
    fetchSettings,
    resetSettings,
  } = useSettingsStore();
  const {
    bookmarks,
    layoutsByMode,
    widgetConfigs,
    setWidgets,
    replaceWidgetData,
    resetWidgets,
    saveWidgetConfigs,
    importBookmarks,
  } = useWidgetStore();
  const { addToast } = useToastStore();

  const t = useTranslations('SettingsModal');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isResetting, setIsResetting] = useState(false);
  const [isClearingLauncherUsage, setIsClearingLauncherUsage] = useState(false);
  const [launcherUsage, setLauncherUsage] = useState<LauncherUsageStore>(() => ({
    version: 1,
    links: {},
  }));
  const [activeSection, setActiveSection] = useState<
    'appearance' | 'weather' | 'language' | 'data'
  >('appearance');
  const [weatherStatus, setWeatherStatus] = useState<WeatherServiceStatus | null>(null);
  const [isWeatherStatusLoading, setIsWeatherStatusLoading] = useState(false);
  const [weatherTestState, setWeatherTestState] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bookmarkInputRef = useRef<HTMLInputElement>(null);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const faviconPreview = customFavicon.trim() || '/favicon.svg';
  const launcherLinkTitles = React.useMemo(() => {
    const entries = collectLauncherBookmarks(bookmarks).flatMap((link) => {
      try {
        return [[canonicalizeLauncherUrl(link.url), link.title] as const];
      } catch {
        return [];
      }
    });
    return new Map(entries);
  }, [bookmarks]);
  const launcherUsageItems = React.useMemo(
    () =>
      Object.values(launcherUsage.links)
        .sort((a, b) => {
          if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
          return b.lastOpenedAt - a.lastOpenedAt;
        })
        .slice(0, 8),
    [launcherUsage]
  );

  const backgroundPresets = [
    {
      id: 'dots',
      label: t('preset_dots'),
      value: 'radial-gradient(#d1d5db 2px, transparent 2px)',
      size: '24px 24px',
      repeat: 'repeat',
    },
    {
      id: 'grid',
      label: t('preset_grid'),
      value:
        'linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)',
      size: '32px 32px',
      repeat: 'repeat',
    },
    {
      id: 'glow',
      label: t('preset_glow'),
      value:
        'radial-gradient(circle at top left, rgba(59,130,246,0.22), transparent 35%), radial-gradient(circle at bottom right, rgba(16,185,129,0.18), transparent 28%), linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%)',
      size: 'cover',
      repeat: 'no-repeat',
    },
    {
      id: 'none',
      label: t('preset_none'),
      value: 'linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92))',
      size: 'cover',
      repeat: 'no-repeat',
    },
  ];

  const applyBackgroundPreset = (value: string, size: string, repeat: string) => {
    setBackgroundImage(value);
    setBackgroundSize(size);
    setBackgroundRepeat(repeat);
  };

  const handleLanguageChange = (newLocale: string) => {
    setLanguage(newLocale);
    startTransition(() => {
      // @ts-ignore
      router.replace(pathname, { locale: newLocale });
    });
  };

  const handleExport = () => {
    const data = {
      widgetLayoutsByMode: layoutsByMode,
      widgetConfigs,
      bookmarks,
      launcherUsage: readLauncherUsage(),
      settings: {
        customFavicon,
        customTitle,
        backgroundImage,
        backgroundBlur,
        backgroundOpacity,
        backgroundSize,
        backgroundRepeat,
        language: locale,
      },
      exportDate: new Date().toISOString(),
      version: 3,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `navidash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    addToast(t('backup_exported'), 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        const shouldImportLauncherUsage =
          data.launcherUsage &&
          window.confirm(t('launcher_usage_import_warning'));

        let widgetsChanged = false;
        if (data.widgetLayoutsByMode && data.widgetConfigs) {
          if (
            !replaceWidgetData(
              data.widgetLayoutsByMode,
              data.widgetConfigs,
              data.bookmarks ?? []
            )
          ) {
            throw new Error('Invalid widget backup data');
          }
          widgetsChanged = true;
        } else if (data.widgets && Array.isArray(data.widgets)) {
          setWidgets(data.widgets);
          widgetsChanged = true;
        }

        if (data.settings) {
          if (typeof data.settings.customFavicon === 'string') {
            setCustomFavicon(data.settings.customFavicon);
          }
          if (typeof data.settings.customTitle === 'string') setCustomTitle(data.settings.customTitle);
          if (typeof data.settings.backgroundImage === 'string') {
            setBackgroundImage(data.settings.backgroundImage);
          }
          if (typeof data.settings.backgroundBlur === 'number') {
            setBackgroundBlur(data.settings.backgroundBlur);
          }
          if (typeof data.settings.backgroundOpacity === 'number') {
            setBackgroundOpacity(data.settings.backgroundOpacity);
          }
          if (typeof data.settings.backgroundSize === 'string') {
            setBackgroundSize(data.settings.backgroundSize);
          }
          if (typeof data.settings.backgroundRepeat === 'string') {
            setBackgroundRepeat(data.settings.backgroundRepeat);
          }
          if (typeof data.settings.language === 'string') {
            handleLanguageChange(data.settings.language);
          }
        }

        if (shouldImportLauncherUsage) {
          setLauncherUsage(replaceLauncherUsage(data.launcherUsage));
        }

        if (widgetsChanged && !(await saveWidgetConfigs())) {
          throw new Error('Widget snapshot save failed');
        }

        addToast(t('config_restored'), 'success');
        onClose();
      } catch (error) {
        console.error('Import error:', error);
        addToast(t('import_failed'), 'error');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = HOMEPAGE_TEMPLATES.find((item) => item.id === templateId);
    if (!template || !window.confirm(t('template_replace_warning'))) return;

    if (!replaceWidgetData(template.layoutsByMode, template.configs, bookmarks)) {
      addToast(t('template_apply_failed'), 'error');
      return;
    }

    const saved = await saveWidgetConfigs();
    addToast(saved ? t('template_applied') : t('template_apply_failed'), saved ? 'success' : 'error');
  };

  const handleBookmarkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const imported = createBookmarkImportData(
          String(loadEvent.target?.result ?? ''),
          undefined
        );
        if (imported.count === 0) throw new Error('No supported bookmarks');
        if (!window.confirm(t('bookmark_import_warning', { count: imported.count }))) return;
        const added = importBookmarks(imported.bookmarks);
        if (!(await saveWidgetConfigs())) throw new Error('Widget snapshot save failed');
        addToast(t('bookmarks_imported', { count: added }), 'success');
      } catch (error) {
        console.error('Bookmark import error:', error);
        addToast(t('bookmark_import_failed'), 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReset = () => {
    if (!isResetting) {
      setIsResetting(true);
      return;
    }

    resetSettings();
    resetWidgets();
    clearLauncherHistory();
    setLauncherUsage(clearLauncherUsage());
    setIsResetting(false);
    addToast(t('reset_complete'), 'success');
    onClose();
  };

  const sections = [
    { id: 'appearance' as const, label: t('appearance'), icon: Palette },
    { id: 'weather' as const, label: t('weather_service'), icon: CloudSun },
    { id: 'language' as const, label: t('language'), icon: Globe },
    { id: 'data' as const, label: t('data_tools'), icon: FileJson },
  ];

  const refreshWeatherStatus = React.useCallback(async () => {
    setIsWeatherStatusLoading(true);

    try {
      const response = await fetch('/api/weather/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('Weather status request failed');
      setWeatherStatus((await response.json()) as WeatherServiceStatus);
    } catch {
      setWeatherStatus(null);
    } finally {
      setIsWeatherStatusLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    fetchSettings(true);
    setLauncherUsage(readLauncherUsage());
    setWeatherTestState('idle');
    void refreshWeatherStatus();
  }, [fetchSettings, isOpen, refreshWeatherStatus]);

  React.useEffect(() => {
    const refreshUsage = () => setLauncherUsage(readLauncherUsage());
    window.addEventListener(LAUNCHER_USAGE_CHANGED_EVENT, refreshUsage);
    return () => window.removeEventListener(LAUNCHER_USAGE_CHANGED_EVENT, refreshUsage);
  }, []);

  const handleClearLauncherLink = (url: string) => {
    setLauncherUsage(clearLauncherLinkUsage(url));
  };

  const handleClearLauncherQuery = (url: string, query: string) => {
    setLauncherUsage(clearLauncherQueryUsage(url, query));
  };

  const handleClearAllLauncherUsage = () => {
    if (!isClearingLauncherUsage) {
      setIsClearingLauncherUsage(true);
      return;
    }

    setLauncherUsage(clearLauncherUsage());
    setIsClearingLauncherUsage(false);
    addToast(t('launcher_usage_cleared'), 'success');
  };

  const handleTestWeatherConnection = async () => {
    setWeatherTestState('testing');

    try {
      const response = await fetch('/api/weather/status', { method: 'POST' });
      setWeatherTestState(response.ok ? 'success' : 'error');
    } catch {
      setWeatherTestState('error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[rgb(var(--primary-color))] text-white shadow-sm">
            <Settings2 size={15} />
          </span>
          {t('title')}
        </span>
      }
      overlayClassName="items-end bg-slate-950/12 p-0 pb-[5.75rem] backdrop-blur-[1px]"
      className="h-[min(68vh,600px)] max-h-none w-[calc(100%_-_1.5rem)] max-w-6xl overflow-hidden rounded-[2rem] border-0 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8)]"
      headerClassName="border-0 bg-transparent px-5 py-3"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    )}
                  >
                    <Icon size={15} />
                    {section.label}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              <Check size={14} />
              {isDemoMode ? 'Demo changes reset on refresh' : t('autosave_status')}
            </div>
          </div>
          <div className="mx-auto mt-2 max-w-6xl">
            <p className="text-xs leading-5 text-slate-500">{t('subtitle')}</p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
            {activeSection === 'appearance' && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 lg:p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Palette size={16} />
                  <span>{t('appearance')}</span>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-5">
                    <details className="rounded-2xl bg-white/70 p-4">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        {t('advanced_branding')}
                      </summary>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {t('website_title')}
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Navidash"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {t('custom_favicon')}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customFavicon}
                              onChange={(e) => setCustomFavicon(e.target.value)}
                              placeholder="/favicon.svg"
                              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-300"
                            />
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={faviconPreview}
                                alt="favicon preview"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = '/favicon.svg';
                                }}
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{t('favicon_desc')}</p>
                        </div>
                      </div>
                    </details>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {t('image_url')}
                      </label>
                      <input
                        type="text"
                        value={backgroundImage}
                        onChange={(e) => {
                          setBackgroundImage(e.target.value);
                          setBackgroundSize('cover');
                          setBackgroundRepeat('no-repeat');
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-300 focus:ring-4 focus:ring-[rgba(var(--primary-color),0.12)]"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="mt-2 text-xs text-slate-400">{t('image_url_desc')}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {t('background_presets')}
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        {backgroundPresets.map((preset) => {
                          const selected =
                            backgroundImage === preset.value &&
                            backgroundSize === preset.size &&
                            backgroundRepeat === preset.repeat;

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() =>
                                applyBackgroundPreset(preset.value, preset.size, preset.repeat)
                              }
                              className={cn(
                                'rounded-xl border px-3 py-2.5 text-left transition-colors',
                                selected
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                              )}
                            >
                              <span className="block text-sm font-medium">{preset.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {t('blur')}
                          </label>
                          <span className="text-xs text-slate-500">{backgroundBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={backgroundBlur}
                          onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                          className="w-full accent-[rgb(var(--primary-color))]"
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {t('opacity')}
                          </label>
                          <span className="text-xs text-slate-500">
                            {Math.round(backgroundOpacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={backgroundOpacity}
                          onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                          className="w-full accent-[rgb(var(--primary-color))]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'weather' && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 lg:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center text-sm font-semibold text-slate-900">
                      <CloudSun size={17} className="mr-2" />
                      {t('weather_service')}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      {t('weather_service_desc')}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      weatherStatus?.configured
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {isWeatherStatusLoading
                      ? t('weather_status_loading')
                      : weatherStatus?.configured
                        ? t('weather_configured')
                        : t('weather_not_configured')}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-xs font-medium text-slate-400">
                      {t('weather_provider')}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {weatherStatus?.provider ?? 'QWeather'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-xs font-medium text-slate-400">
                      {t('weather_host')}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {weatherStatus?.host ?? 'https://devapi.qweather.com'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-xs font-medium text-slate-400">
                      {t('weather_auth_type')}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {weatherStatus?.authType === 'jwt'
                        ? t('weather_auth_jwt')
                        : t('weather_auth_apikey')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t('weather_env_title')}
                  </div>
                  <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-200">
                    <code>{`QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=https://devapi.qweather.com
QWEATHER_AUTH_TYPE=apikey`}</code>
                  </pre>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {t('weather_env_desc')}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {t('weather_secret_notice')}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestWeatherConnection}
                    disabled={
                      !weatherStatus?.configured ||
                      weatherTestState === 'testing'
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CloudSun size={16} />
                    {weatherTestState === 'testing'
                      ? t('weather_testing')
                      : t('weather_test_connection')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshWeatherStatus()}
                    disabled={isWeatherStatusLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={cn(isWeatherStatusLoading && 'animate-spin')}
                    />
                    {t('weather_refresh_status')}
                  </button>

                  {weatherTestState === 'success' && (
                    <span className="text-sm font-medium text-emerald-600">
                      {t('weather_test_success')}
                    </span>
                  )}
                  {weatherTestState === 'error' && (
                    <span className="text-sm font-medium text-red-600">
                      {t('weather_test_failed')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'language' && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 lg:p-5">
                <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-900">
                  <Globe size={16} className="mr-2" />
                  {t('language')}
                </h3>
                <p className="mb-4 text-sm leading-6 text-slate-500">{t('language_desc')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'en', label: 'English', desc: t('language_en_desc') },
                    { id: 'zh', label: '中文', desc: t('language_zh_desc') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      disabled={isPending}
                      onClick={() => handleLanguageChange(item.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                        locale === item.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                        isPending && 'cursor-not-allowed opacity-60'
                      )}
                      title={item.desc}
                    >
                      <span>{item.label}</span>
                      {locale === item.id && <Check size={16} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5">
                  <h3 className="flex items-center text-sm font-semibold text-slate-900">
                    <LayoutTemplate size={16} className="mr-2" />
                    {t('homepage_templates')}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t('homepage_templates_desc')}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {HOMEPAGE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => void handleApplyTemplate(template.id)}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60"
                      >
                        <span className="block text-sm font-semibold text-slate-800">
                          {t(template.titleKey)}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {t(template.descriptionKey)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5">
                  <h3 className="flex items-center text-sm font-semibold text-slate-900">
                    <Upload size={16} className="mr-2" />
                    {t('bookmark_import')}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t('bookmark_import_desc')}
                  </p>
                  <input
                    ref={bookmarkInputRef}
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={handleBookmarkFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bookmarkInputRef.current?.click()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    <span>{t('choose_bookmark_file')}</span>
                    <Upload size={16} />
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 lg:p-5">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-900">
                    <FileJson size={16} className="mr-2" />
                    {t('data_tools')}
                  </h3>
                  <p className="mb-4 text-sm leading-6 text-slate-500">{t('data_tools_desc')}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span>{t('export_config')}</span>
                      <Download size={16} className="shrink-0" />
                    </button>

                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                      />
                      <button
                        onClick={handleImportClick}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        <span>{t('import_config')}</span>
                        <Upload size={16} className="shrink-0" />
                      </button>
                    </>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {t('launcher_usage_title')}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {t('launcher_usage_desc')}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      {t('launcher_usage_count', {
                        count: Object.keys(launcherUsage.links).length,
                      })}
                    </span>
                  </div>

                  {launcherUsageItems.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {launcherUsageItems.map((record) => {
                        const queryEntries = Object.entries(record.queryStats)
                          .sort(([, a], [, b]) => b.count - a.count)
                          .slice(0, 5);
                        let hostname = record.canonicalUrl;
                        try {
                          hostname = new URL(record.canonicalUrl).hostname.replace(/^www\./, '');
                        } catch {
                          // Keep the canonical URL as the fallback label.
                        }

                        return (
                          <div
                            key={record.canonicalUrl}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">
                                  {launcherLinkTitles.get(record.canonicalUrl) ?? hostname}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-slate-400">{hostname}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs font-medium text-slate-500">
                                  {t('launcher_usage_visits', { count: record.totalCount })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleClearLauncherLink(record.canonicalUrl)}
                                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  aria-label={t('launcher_usage_clear_link')}
                                  title={t('launcher_usage_clear_link')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {queryEntries.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {queryEntries.map(([query, queryRecord]) => (
                                  <button
                                    key={query}
                                    type="button"
                                    onClick={() =>
                                      handleClearLauncherQuery(record.canonicalUrl, query)
                                    }
                                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 transition-colors hover:border-red-200 hover:text-red-600"
                                    title={t('launcher_usage_clear_query')}
                                  >
                                    {query} · {queryRecord.count} ×
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                      {t('launcher_usage_empty')}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-red-200 bg-red-50/70 p-4 lg:p-5">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-red-800">
                    <AlertTriangle size={16} className="mr-2" />
                    {t('danger_zone')}
                  </h3>
                  <p className="mb-4 text-sm leading-6 text-red-700/75">
                    {isDemoMode
                      ? 'Demo 中的重置只会恢复当前页面的预置内容。'
                      : t('danger_desc')}
                  </p>
                  <button
                    onClick={handleReset}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                      isResetting
                        ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                        : 'border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50'
                    )}
                  >
                    <span>{isResetting ? t('confirm_reset') : t('reset_defaults')}</span>
                    {isResetting ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
                  </button>
                  <button
                    onClick={handleClearAllLauncherUsage}
                    disabled={launcherUsageItems.length === 0}
                    className={cn(
                      'ml-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      isClearingLauncherUsage
                        ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                        : 'border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50'
                    )}
                  >
                    <span>
                      {isClearingLauncherUsage
                        ? t('launcher_usage_confirm_clear')
                        : t('launcher_usage_clear_all')}
                    </span>
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {t('done')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
