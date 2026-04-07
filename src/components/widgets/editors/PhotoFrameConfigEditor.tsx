'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FormField, SelectInput, TextArea, TextInput } from './FormControls';
import { trimToUndefined } from './shared';
import { WidgetConfigEditorProps } from './types';

export default function PhotoFrameConfigEditor({ config, setConfig }: WidgetConfigEditorProps<'photo-frame'>) {
  const t = useTranslations('Widgets');
  const imageText = React.useMemo(() => {
    const images = config.images?.length ? config.images : config.imageUrl ? [config.imageUrl] : [];
    return images.join('\n');
  }, [config.imageUrl, config.images]);

  const previewImages = React.useMemo(
    () =>
      imageText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [imageText]
  );

  const updateImages = (value: string) => {
    const images = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    setConfig((current) => ({
      ...current,
      images: images.length ? images : undefined,
      imageUrl: images[0],
    }));
  };

  return (
    <div className="space-y-3">
      <FormField label={t('image_urls')} hint={t('image_urls_hint')}>
        <TextArea
          value={imageText}
          onChange={(e) => updateImages(e.target.value)}
          onBlur={(e) => updateImages(e.target.value)}
          rows={5}
          placeholder="https://..."
          aria-label={t('image_urls')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('autoplay')}>
          <SelectInput
            value={String(config.autoplay ?? true)}
            onChange={(e) =>
              setConfig((current) => ({ ...current, autoplay: e.target.value === 'true' }))
            }
          >
            <option value="true">{t('enabled')}</option>
            <option value="false">{t('disabled')}</option>
          </SelectInput>
        </FormField>

        <FormField label={t('play_order')}>
          <SelectInput
            value={(config.shuffle ?? false) ? 'shuffle' : 'sequence'}
            onChange={(e) =>
              setConfig((current) => ({ ...current, shuffle: e.target.value === 'shuffle' }))
            }
          >
            <option value="sequence">{t('play_order_sequence')}</option>
            <option value="shuffle">{t('play_order_shuffle')}</option>
          </SelectInput>
        </FormField>
      </div>

      <FormField label={t('rotation_interval')}>
        <TextInput
          type="number"
          min={1}
          step={1}
          value={String(Math.max(1, Math.round((config.interval ?? 5000) / 1000)))}
          onChange={(e) => {
            const seconds = Math.max(1, Number(e.target.value) || 1);
            setConfig((current) => ({ ...current, interval: seconds * 1000 }));
          }}
          onBlur={(e) => {
            const seconds = Math.max(1, Number(trimToUndefined(e.target.value)) || 5);
            setConfig((current) => ({ ...current, interval: seconds * 1000 }));
          }}
          aria-label={t('rotation_interval')}
        />
      </FormField>

      {previewImages.length ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs text-gray-500">{t('image_preview')}</p>
          <div className="grid grid-cols-2 gap-2">
            {previewImages.slice(0, 4).map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`${t('image_preview')} ${index + 1}`}
                className="h-24 w-full rounded-lg border border-gray-200 bg-white object-cover"
              />
            ))}
          </div>
          {previewImages.length > 4 ? (
            <p className="mt-2 text-xs text-gray-500">
              {t('more_images_count', { count: previewImages.length - 4 })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
