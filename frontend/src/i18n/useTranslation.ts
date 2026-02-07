import { useSyncExternalStore } from 'react';
import { t, getLang, subscribe } from './translations';
import type { Lang } from './translations';

export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getLang);
  return { t, lang } as { t: typeof t; lang: Lang };
}
