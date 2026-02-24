import { useSyncExternalStore } from 'react';
import { getTheme, subscribeTheme } from './theme';
import type { Theme } from './theme';

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  return theme as Theme;
}
