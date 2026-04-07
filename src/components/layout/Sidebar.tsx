'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useUIStore } from '@/store/useUIStore';
import SettingsModal from '@/components/settings/SettingsModal';
import WidgetStoreSidebar from './WidgetStoreSidebar';

export default function Sidebar() {
  const { isOpen, close } = useSidebarStore();
  const { isSettingsOpen, closeSettings } = useUIStore();
  const t = useTranslations('Sidebar');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-[3px] transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-full max-w-[340px] flex-col overflow-hidden border-r border-slate-200/80 bg-white/96 shadow-2xl shadow-slate-900/10 backdrop-blur-xl',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label={t('widget_store')}
      >
        <div className="relative shrink-0 border-b border-slate-200/70 px-4 pb-3 pt-4">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-80"
            style={{
              background:
                'linear-gradient(180deg, rgba(var(--primary-color), 0.12) 0%, rgba(var(--primary-color), 0.03) 55%, rgba(255,255,255,0) 100%)',
            }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <Sparkles size={15} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    NaviDash
                  </p>
                  <h2 className="text-base font-semibold tracking-tight text-slate-900">
                    {t('widget_store')}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDemoMode && (
                <span className="inline-flex shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Demo
                </span>
              )}
              <button
                onClick={close}
                className="relative z-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                aria-label={t('toggle_sidebar')}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <WidgetStoreSidebar />
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </>
  );
}
