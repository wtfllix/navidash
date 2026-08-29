'use client';

import { useTranslations } from 'next-intl';
import { WidgetConfigEditorProps } from './types';

export default function F1ConfigEditor({
  config,
  setConfig,
}: WidgetConfigEditorProps<'f1'>) {
  const t = useTranslations('Widgets');

  const options = [
    {
      key: 'showPractice' as const,
      label: t('f1_show_practice'),
      description: t('f1_show_practice_hint'),
      checked: config.showPractice ?? false,
    },
    {
      key: 'showCountdown' as const,
      label: t('f1_show_countdown'),
      description: t('f1_show_countdown_hint'),
      checked: config.showCountdown ?? true,
    },
  ];

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.key}
          className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-800">{option.label}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {option.description}
            </span>
          </span>
          <input
            type="checkbox"
            checked={option.checked}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                [option.key]: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 shrink-0 accent-red-600"
          />
        </label>
      ))}
      <p className="text-xs leading-5 text-slate-500">{t('f1_data_hint')}</p>
    </div>
  );
}
