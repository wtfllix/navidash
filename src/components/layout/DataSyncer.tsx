'use client';

import { useCallback, useEffect } from 'react';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isClientDemoMode } from '@/lib/demo';

export default function DataSyncer() {
  const { fetchWidgets } = useWidgetStore();
  const { fetchSettings } = useSettingsStore();
  const fetchAll = useCallback(
    (forceSettings = false) => {
      fetchWidgets();
      fetchSettings(forceSettings);
    },
    [fetchSettings, fetchWidgets]
  );

  useEffect(() => {
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

    const handleFocus = () => {
      if (!document.hidden) {
        fetchAll(true);
      }
    };

    const handlePageShow = () => {
      fetchAll(true);
      startPolling();
    };

    const handleOnline = () => {
      fetchAll(true);
      startPolling();
    };

    // Start polling initially if visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchAll]);

  return null;
}
