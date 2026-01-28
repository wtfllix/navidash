'use client';

import { useEffect } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useWidgetStore } from '@/store/useWidgetStore';

export default function DataSyncer() {
  const { fetchBookmarks } = useBookmarkStore();
  const { fetchWidgets } = useWidgetStore();

  useEffect(() => {
    fetchBookmarks();
    fetchWidgets();
  }, [fetchBookmarks, fetchWidgets]);

  return null;
}
