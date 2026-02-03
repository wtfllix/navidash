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
    // Initial fetch
    const fetchAll = () => {
      fetchBookmarks();
      fetchWidgets();
      fetchSettings();
    };

    fetchAll();

    // Polling logic
    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(fetchAll, 5000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchAll(); // Immediate fetch on resume
        startPolling();
      }
    };

    // Start polling initially if visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchBookmarks, fetchWidgets, fetchSettings]);

  return null;
}
