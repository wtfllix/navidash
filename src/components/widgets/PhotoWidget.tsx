import React from 'react';
import { Widget } from '@/types';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PhotoWidgetProps {
  widget: Widget;
}

export default function PhotoWidget({ widget }: PhotoWidgetProps) {
  const t = useTranslations('Widgets');
  const imageUrl = widget.config.imageUrl;

  if (!imageUrl) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-4">
        <ImageIcon size={32} className="mb-2 opacity-50" />
        <span className="text-xs text-center">{t('no_image_selected')}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Widget Photo"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
  );
}
