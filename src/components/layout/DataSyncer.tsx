'use client';

import { useEffect } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function DataSyncer() {
  const { fetchBookmarks } = useBookmarkStore();
  const { fetchWidgets } = useWidgetStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchBookmarks();
    fetchWidgets();
    fetchSettings();
  }, [fetchBookmarks, fetchWidgets, fetchSettings]);

  return null;
}
