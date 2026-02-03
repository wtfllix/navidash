import React, { useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useToastStore } from '@/store/useToastStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Download, Upload, RefreshCw, AlertTriangle, FileJson, Globe, Palette, Image as ImageIcon, Save } from 'lucide-react';
import { Bookmark, Widget } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { 
    backgroundImage, setBackgroundImage, 
    backgroundBlur, setBackgroundBlur,
    backgroundOpacity, setBackgroundOpacity,
    backgroundSize, setBackgroundSize,
    backgroundRepeat, setBackgroundRepeat,
    themeColor, setThemeColor,
    customFavicon, setCustomFavicon,
    customTitle, setCustomTitle,
    setLanguage,
    resetSettings
  } = useSettingsStore();
  const { bookmarks } = useBookmarkStore();
  const { widgets, setWidgets } = useWidgetStore();
  const { addToast } = useToastStore();
  
  // Internationalization
  const t = useTranslations('SettingsModal');
  const tGeneral = useTranslations('General');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const handleLanguageChange = (newLocale: string) => {
    setLanguage(newLocale);
    startTransition(() => {
      // @ts-ignore
      router.replace(pathname, { locale: newLocale });
    });
  };

  // Helper to trigger download
  const handleExport = () => {
    const data = {
      bookmarks,
      widgets,
      settings: {
        themeColor,
        customFavicon,
        customTitle,
        backgroundImage,
        backgroundBlur,
        backgroundOpacity,
        backgroundSize,
        backgroundRepeat
      },
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navidash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
           // @ts-ignore
           useBookmarkStore.getState().setBookmarks?.(data.bookmarks);
        }
        
        if (data.widgets && Array.isArray(data.widgets)) {
          setWidgets(data.widgets);
        }

        if (data.settings) {
          if (typeof data.settings.themeColor === 'string') {
            setThemeColor(data.settings.themeColor);
          }
          if (typeof data.settings.customFavicon === 'string') {
            setCustomFavicon(data.settings.customFavicon);
          }
          if (typeof data.settings.customTitle === 'string') {
            setCustomTitle(data.settings.customTitle);
          }
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

  const handleSync = async () => {
    setIsSyncing(true);
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
        language: locale
      };
      
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      addToast(t('sync_success') || 'Settings synced successfully', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      addToast(t('sync_failed') || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const COLOR_OPTIONS = [
    { label: 'Blue', color: '#3b82f6' },
    { label: 'Purple', color: '#a855f7' },
    { label: 'Pink', color: '#ec4899' },
    { label: 'Orange', color: '#f97316' },
    { label: 'Green', color: '#22c55e' },
    { label: 'Red', color: '#ef4444' },
    { label: 'Slate', color: '#64748b' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('title')}>
      <div className="space-y-6">
        
        {/* Appearance Settings */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Palette size={16} className="mr-2" />
              {t('appearance') || '外观设置'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('appearance_desc') || '自定义主区域的背景风格。'}
            </p>
            
            <div className="space-y-6">
               {/* Theme Color */}
               <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-700 block">
                   {t('theme_color') || '主题色'}
                 </label>
                 <div className="flex flex-wrap gap-3">
                    {COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.color}
                        onClick={() => setThemeColor(option.color)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-1",
                          themeColor === option.color ? "ring-gray-400 scale-110" : "ring-transparent"
                        )}
                        style={{ backgroundColor: option.color }}
                        title={option.label}
                      />
                    ))}
                    <div className="relative group w-6 h-6">
                       <input 
                          type="color" 
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-full h-full rounded-full overflow-hidden border-0 p-0 cursor-pointer opacity-0 absolute inset-0 z-10"
                       />
                       <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-300 border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 group-hover:bg-gray-200 transition-colors">
                          +
                       </div>
                    </div>
                 </div>
               </div>

               {/* Website Title */}
               <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-700 block">
                   {t('website_title') || '网站标题'}
                 </label>
                 <input
                   type="text"
                   value={customTitle}
                   onChange={(e) => setCustomTitle(e.target.value)}
                   placeholder="Navidash"
                   className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                 />
               </div>

               {/* Favicon */}
               <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-700 block">
                   {t('custom_favicon') || '自定义 Favicon'}
                 </label>
                 <div className="flex gap-2">
                    <input
                       type="text"
                       value={customFavicon}
                       onChange={(e) => setCustomFavicon(e.target.value)}
                       placeholder="/favicon.svg"
                       className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <div className="w-9 h-9 shrink-0 rounded border border-gray-200 bg-white flex items-center justify-center p-1.5">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={customFavicon} alt="icon" className="w-full h-full object-contain" onError={(e) => e.currentTarget.src = '/favicon.svg'} />
                    </div>
                 </div>
                 <p className="text-[10px] text-gray-400">
                   {t('favicon_desc') || '输入图片 URL 或使用默认的 /favicon.svg'}
                 </p>
               </div>

               {/* Background Image */}
               <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-700 block">
                   {t('image_url') || '背景图片链接'}
                 </label>
                 <input
                   type="text"
                   value={backgroundImage}
                   onChange={(e) => {
                       setBackgroundImage(e.target.value);
                       setBackgroundSize('cover');
                       setBackgroundRepeat('no-repeat');
                   }}
                   className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                   placeholder="https://example.com/image.jpg"
                 />
               </div>
 
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <label className="text-xs font-medium text-gray-700">
                     {t('blur') || '模糊程度'}
                   </label>
                   <span className="text-xs text-gray-500">{backgroundBlur}px</span>
                 </div>
                 <input
                   type="range"
                   min="0"
                   max="20"
                   step="1"
                   value={backgroundBlur}
                   onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                   className="w-full accent-blue-500"
                 />
               </div>
 
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <label className="text-xs font-medium text-gray-700">
                     {t('opacity') || '遮罩浓度'}
                   </label>
                   <span className="text-xs text-gray-500">{Math.round(backgroundOpacity * 100)}%</span>
                 </div>
                 <input
                   type="range"
                   min="0"
                   max="0.8"
                   step="0.05"
                   value={backgroundOpacity}
                   onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                   className="w-full accent-blue-500"
                 />
               </div>
            </div>
          </div>
        
        {/* Language Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <Globe size={16} className="mr-2" />
            {t('language')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('language_desc')}
          </p>
          <div className="flex space-x-2">
            <button
              disabled={isPending}
              onClick={() => handleLanguageChange('en')}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors",
                locale === 'en' 
                  ? "bg-blue-50 border-blue-500 text-blue-700" 
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              English
            </button>
            <button
              disabled={isPending}
              onClick={() => handleLanguageChange('zh')}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors",
                locale === 'zh' 
                  ? "bg-blue-50 border-blue-500 text-blue-700" 
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              中文
            </button>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <Download size={16} className="mr-2" />
            {t('export_config')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('export_desc')}
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileJson size={16} className="mr-2" />
            {t('download_json')}
          </button>
        </div>

        {/* Import Section */}
        {!isDemoMode && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Upload size={16} className="mr-2" />
              {t('import_config')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('import_desc')}
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
            >
              <Upload size={16} className="mr-2" />
              {t('select_file')}
            </button>
          </div>
        )}

        {/* Sync Section */}
        {!isDemoMode && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Save size={16} className="mr-2" />
              {t('sync_data')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('sync_desc')}
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                "w-full flex items-center justify-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors shadow-sm",
                isSyncing && "opacity-50 cursor-not-allowed"
              )}
            >
              <Save size={16} className="mr-2" />
              {isSyncing ? tGeneral('loading') : t('sync_now')}
            </button>
          </div>
        )}

        {/* Reset Section */}
        {!isDemoMode && (
          <div className="border-t border-gray-100 pt-6">
             <button
              onClick={handleReset}
              className={cn(
                  "w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors border shadow-sm",
                  isResetting 
                      ? "bg-red-600 text-white border-red-600 hover:bg-red-700" 
                      : "bg-white text-red-600 border-red-200 hover:bg-red-50"
              )}
            >
              {isResetting ? (
                  <>
                      <AlertTriangle size={16} className="mr-2" />
                      {t('confirm_reset')}
                  </>
              ) : (
                  <>
                      <RefreshCw size={16} className="mr-2" />
                      {t('reset_defaults')}
                  </>
              )}
            </button>
            {isResetting && (
              <p className="text-xs text-center text-red-500 mt-2">
                  {t('reset_warning')}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
