'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWidgetStore } from '@/store/useWidgetStore';

export default function SnapshotConflictDialog() {
  const t = useTranslations('SnapshotConflict');
  const conflict = useWidgetStore((state) => state.snapshotConflict);
  const resolveSnapshotConflict = useWidgetStore((state) => state.resolveSnapshotConflict);
  const [isResolving, setIsResolving] = useState(false);
  const serverButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (conflict) {
      serverButtonRef.current?.focus();
    }
  }, [conflict]);

  if (!conflict) return null;

  const resolve = async (resolution: 'keep-local' | 'use-server') => {
    setIsResolving(true);
    await resolveSnapshotConflict(resolution);
    setIsResolving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="snapshot-conflict-title"
      aria-describedby="snapshot-conflict-description"
    >
      <div className="w-full max-w-md rounded-[var(--radius-dialog)] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="snapshot-conflict-title" className="text-lg font-semibold text-slate-900">
              {t('title')}
            </h2>
            <p id="snapshot-conflict-description" className="mt-2 text-sm leading-6 text-slate-600">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={serverButtonRef}
            type="button"
            disabled={isResolving}
            onClick={() => void resolve('use-server')}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {t('use_server')}
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => void resolve('keep-local')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isResolving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {t('keep_local')}
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{t('warning')}</p>
      </div>
    </div>
  );
}
