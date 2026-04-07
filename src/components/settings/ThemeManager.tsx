'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ThemeManager() {
  const { themeColor, customFavicon, customTitle } = useSettingsStore();

  useEffect(() => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : '59 130 246';
    };

    const color = themeColor || '#3b82f6';
    document.documentElement.style.setProperty('--primary-color', hexToRgb(color));

    let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [themeColor]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = customFavicon || '/favicon.svg';
  }, [customFavicon]);

  useEffect(() => {
    document.title = customTitle?.trim() || 'Navidash';
  }, [customTitle]);

  return null;
}
