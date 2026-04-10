'use client';

import React, { useRef, useState, useTransition } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  FileJson,
  Globe,
  Palette,
  RefreshCw,
  Save,
  Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from '@/navigation';
import Modal from '@/components/ui/Modal';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToastStore } from '@/store/useToastStore';
import { useWidgetStore } from '@/store/useWidgetStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    themeColor,
    setThemeColor,
    customFavicon,
    setCustomFavicon,
    customTitle,
    setCustomTitle,
    setLanguage,
    fetchSettings,
  } = useSettingsStore();
  const { widgets, layoutsByMode, widgetConfigs, setWidgets } = useWidgetStore();
  const { addToast } = useToastStore();

  const t = useTranslations('SettingsModal');
  const tGeneral = useTranslations('General');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isResetting, setIsResetting] = useState(false);
  const [isSavingSettingsNow, setIsSavingSettingsNow] = useState(false);
  const [activeSection, setActiveSection] = useState<'appearance' | 'language' | 'data'>(
    'appearance'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const faviconPreview = customFavicon.trim() || '/favicon.svg';

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

  const COLOR_OPTIONS = [
    { label: 'Blue', color: '#3b82f6' },
    { label: 'Teal', color: '#0f766e' },
    { label: 'Amber', color: '#f59e0b' },
    { label: 'Orange', color: '#f97316' },
    { label: 'Green', color: '#22c55e' },
    { label: 'Rose', color: '#f43f5e' },
    { label: 'Red', color: '#ef4444' },
    { label: 'Slate', color: '#64748b' },
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
      widgets,
      widgetLayoutsByMode: layoutsByMode,
      widgetConfigs,
      settings: {
        themeColor,
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
      version: '1.0',
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
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);

        if (data.widgetLayoutsByMode && data.widgetConfigs) {
          const nextWidgets =
            data.widgetLayoutsByMode.desktop?.map((layout: any) => {
              const configEntry = data.widgetConfigs.find((item: any) => item.id === layout.id);
              return {
                ...layout,
                config: configEntry?.config ?? {},
              };
            }) ?? [];

          setWidgets(nextWidgets);
        } else if (data.widgets && Array.isArray(data.widgets)) {
          setWidgets(data.widgets);
        }

        if (data.settings) {
          if (typeof data.settings.themeColor === 'string') setThemeColor(data.settings.themeColor);
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
            setLanguage(data.settings.language);
          }
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

  const handleReset = () => {
    if (!isResetting) {
      setIsResetting(true);
      return;
    }

    localStorage.clear();
    window.location.reload();
  };

  const handleSaveAndClose = async () => {
    if (isDemoMode) {
      addToast('Demo changes stay local and reset on refresh.', 'info');
      onClose();
      return;
    }

    setIsSavingSettingsNow(true);

    try {
      const settings = {
        themeColor,
        customFavicon,
        customTitle,
        backgroundImage,
        backgroundBlur,
        backgroundOpacity,
        backgroundSize,
        backgroundRepeat,
        language: locale,
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      addToast(t('settings_saved'), 'success');
      onClose();
    } catch (error) {
      console.error('Save settings failed:', error);
      addToast(t('sync_error'), 'error');
    } finally {
      setIsSavingSettingsNow(false);
    }
  };

  const sections = [
    { id: 'appearance' as const, label: t('appearance'), icon: Palette },
    { id: 'language' as const, label: t('language'), icon: Globe },
    { id: 'data' as const, label: t('data_tools'), icon: FileJson },
  ];

  React.useEffect(() => {
    if (!isOpen) return;
    fetchSettings(true);
  }, [fetchSettings, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      className="max-h-none h-[calc(100vh-12px)] max-w-[min(1680px,calc(100vw-12px))] overflow-hidden rounded-[24px] border border-slate-200/80 shadow-2xl shadow-slate-900/10"
      headerClassName="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-6 py-4"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
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
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {t('theme_color')}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {COLOR_OPTIONS.map((option) => (
                          <button
                            key={option.color}
                            type="button"
                            onClick={() => setThemeColor(option.color)}
                            className={cn(
                              'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white transition-transform hover:scale-110 focus:outline-none',
                              themeColor === option.color ? 'scale-110 ring-slate-400' : 'ring-transparent'
                            )}
                            style={{ backgroundColor: option.color }}
                            title={option.label}
                            aria-label={option.label}
                          />
                        ))}
                        <div className="group relative h-8 w-8">
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            aria-label={t('custom_color')}
                          />
                          <div className="flex h-full w-full items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-300 text-[10px] text-slate-500 transition-colors group-hover:bg-slate-200">
                            +
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {t('website_title')}
                        </label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Navidash"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-300 focus:ring-4 focus:ring-[rgba(var(--primary-color),0.12)]"
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
                            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-300 focus:ring-4 focus:ring-[rgba(var(--primary-color),0.12)]"
                          />
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
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
                              <span
                                className={cn(
                                  'mt-1 block text-xs',
                                  selected ? 'text-white/70' : 'text-slate-400'
                                )}
                              >
                                {preset.size} / {preset.repeat}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {t('fill_mode')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['cover', 'contain', 'auto'].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setBackgroundSize(value)}
                              className={cn(
                                'rounded-2xl border px-3 py-2 text-sm transition-colors',
                                backgroundSize === value
                                  ? 'border-transparent bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              )}
                            >
                              {t(value)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {t('repeat_mode')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['no-repeat', 'repeat', 'repeat-x', 'repeat-y'].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setBackgroundRepeat(value)}
                              className={cn(
                                'rounded-2xl border px-3 py-2 text-sm transition-colors',
                                backgroundRepeat === value
                                  ? 'border-transparent bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              )}
                            >
                              {t(value)}
                            </button>
                          ))}
                        </div>
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
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              {tGeneral('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              disabled={isSavingSettingsNow}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800',
                isSavingSettingsNow && 'cursor-not-allowed opacity-60'
              )}
            >
              <Save size={15} />
              {isSavingSettingsNow
                ? tGeneral('loading')
                : isDemoMode
                  ? 'Apply locally'
                  : t('save_settings')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
