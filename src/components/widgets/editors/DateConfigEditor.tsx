'use client';

import { useTranslations } from 'next-intl';
import { FormField } from './FormControls';
import { COLOR_OPTIONS } from './shared';
import { WidgetConfigEditorProps } from './types';

export default function DateConfigEditor({ config, setConfig }: WidgetConfigEditorProps<'date'>) {
  const t = useTranslations('Widgets');

  return (
    <div className="space-y-4">
      <FormField label={t('theme_color')} hint={t('date_color_random_hint')}>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.color}
              type="button"
              onClick={() =>
                setConfig((current) => ({
                  ...current,
                  color: current.color === option.color ? undefined : option.color,
                }))
              }
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                config.color === option.color ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: option.color }}
              aria-label={`Select color ${option.label}`}
              title={option.label}
            />
          ))}
        </div>
      </FormField>
    </div>
  );
}
