import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import { captureContainer } from '../utils/capture';

interface ScreenshotResult {
  saved: boolean;
  path?: string;
  file_name?: string;
}

/**
 * Captures the media shown inside the given element (no overlay buttons or
 * browser chrome) and saves it to the folder configured in Settings.
 */
export function useScreenshot() {
  const [capturing, setCapturing] = useState(false);
  const { t } = useTranslation();

  const capture = useCallback(async (target: HTMLElement | null) => {
    if (capturing || !target) return;
    setCapturing(true);
    try {
      const canvas = captureContainer(target);
      const image = canvas.toDataURL('image/png');
      const res = await api.post<ScreenshotResult>('/screenshot', { image });
      if (res.saved) {
        alert(`${t('viewer.screenshotSaved')}\n${res.path ?? ''}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('screenshot_folder_not_set') || msg.includes('screenshot_folder_not_found')) {
        alert(t('viewer.screenshotNoFolder'));
      } else {
        alert(t('viewer.screenshotFailed'));
      }
    } finally {
      setCapturing(false);
    }
  }, [capturing, t]);

  return { capture, capturing };
}
