'use client';

import { useEffect } from 'react';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isClientDemoMode } from '@/lib/demo';

export default function DataSyncer() {
  const { fetchWidgets } = useWidgetStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Initial fetch
    const fetchAll = (forceSettings = false) => {
      fetchWidgets();
      fetchSettings(forceSettings);
    };

    fetchAll(true);

    if (isClientDemoMode) {
      return;
    }

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
        fetchAll(true); // Immediate fetch on resume
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
  }, [fetchWidgets, fetchSettings]);

  return null;
}
