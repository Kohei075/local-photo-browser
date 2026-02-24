export type Theme = 'beige' | 'dark' | 'light';

let currentTheme: Theme = (localStorage.getItem('app_theme') as Theme) || 'beige';
const listeners = new Set<() => void>();

function applyTheme(theme: Theme) {
  if (theme === 'beige') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Apply on load
applyTheme(currentTheme);

export function getTheme(): Theme {
  return currentTheme;
}

export function setTheme(theme: Theme) {
  currentTheme = theme;
  localStorage.setItem('app_theme', theme);
  applyTheme(theme);
  listeners.forEach((fn) => fn());
}

export function subscribeTheme(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
