'use client';

import { useTranslations } from 'next-intl';
import { FormField, TextInput } from './FormControls';
import { getLinkDomain, trimToUndefined } from './shared';
import { WidgetConfigEditorProps } from './types';

export default function QuickLinkConfigEditor({ config, setConfig }: WidgetConfigEditorProps<'quick-link'>) {
  const t = useTranslations('Widgets');
  const urlPreview = config.url ? getLinkDomain(config.url) : '';

  return (
    <div className="space-y-4">
      <FormField label={t('widget_title')}>
        <TextInput
          type="text"
          value={config.title || ''}
          onChange={(e) => setConfig((current) => ({ ...current, title: e.target.value }))}
          onBlur={(e) => setConfig((current) => ({ ...current, title: trimToUndefined(e.target.value) }))}
          aria-label={t('widget_title')}
        />
      </FormField>
      <FormField
        label={t('widget_url')}
        hint={urlPreview ? t('quick_link_domain_hint', { domain: urlPreview }) : undefined}
      >
        <TextInput
          type="text"
          value={config.url || ''}
          onChange={(e) => setConfig((current) => ({ ...current, url: e.target.value }))}
          onBlur={(e) => setConfig((current) => ({ ...current, url: trimToUndefined(e.target.value) }))}
          placeholder="https://..."
          aria-label={t('widget_url')}
        />
      </FormField>
    </div>
  );
}
