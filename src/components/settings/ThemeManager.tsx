'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ThemeManager() {
  const { customFavicon, customTitle } = useSettingsStore();

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
