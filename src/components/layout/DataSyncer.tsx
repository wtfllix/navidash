'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isClientDemoMode } from '@/lib/demo';

export default function DataSyncer() {
  const { fetchWidgets } = useWidgetStore();
  const { fetchSettings } = useSettingsStore();
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const lastSyncStartedAtRef = useRef(0);
  const fetchAll = useCallback(
    async (forceSettings = false) => {
      await Promise.all([fetchWidgets(), fetchSettings(forceSettings)]);
    },
    [fetchSettings, fetchWidgets]
  );
  const requestSync = useCallback(
    (forceSettings = false, bypassThrottle = false) => {
      if (syncInFlightRef.current) {
        return;
      }

      const now = Date.now();
      if (!bypassThrottle && now - lastSyncStartedAtRef.current < 1000) {
        return;
      }

      lastSyncStartedAtRef.current = now;
      const sync = fetchAll(forceSettings).finally(() => {
        if (syncInFlightRef.current === sync) {
          syncInFlightRef.current = null;
        }
      });
      syncInFlightRef.current = sync;
    },
    [fetchAll]
  );

  useEffect(() => {
    requestSync(true, true);

    if (isClientDemoMode) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        requestSync(true);
      }
    };

    const handleFocus = () => {
      if (!document.hidden) {
        requestSync(true);
      }
    };

    const handlePageShow = () => {
      requestSync(true);
    };

    const handleOnline = () => {
      requestSync(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
    };
  }, [requestSync]);

  return null;
}
