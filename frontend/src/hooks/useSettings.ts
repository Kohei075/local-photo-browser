import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import type { Settings, ScanStatus } from '../types';
import { useAppStore } from '../stores/appStore';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { setScanStatus } = useAppStore();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Settings>('/settings');
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (update: Partial<Settings>) => {
    const data = await api.put<Settings>('/settings', update);
    setSettings(data);
    return data;
  }, []);

  const startScan = useCallback(async () => {
    await api.post('/scan');
  }, []);

  const pollScanStatus = useCallback(async () => {
    const status = await api.get<ScanStatus>('/scan/status');
    setScanStatus(status);
    return status;
  }, [setScanStatus]);

  const clearCache = useCallback(async () => {
    await api.post('/settings/clear-cache');
  }, []);

  const resetDb = useCallback(async () => {
    await api.post('/settings/reset-db');
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, fetchSettings, updateSettings, startScan, pollScanStatus, clearCache, resetDb };
}
