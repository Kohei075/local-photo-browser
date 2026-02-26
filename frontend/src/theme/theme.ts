export type Theme = 'system' | 'dark' | 'light';

const stored = localStorage.getItem('app_theme');
let currentTheme: Theme = (stored === 'dark' || stored === 'light') ? stored : 'system';
const listeners = new Set<() => void>();

function getSystemPreference(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemPreference() : theme;
  if (resolved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

// Apply on load
applyTheme(currentTheme);

// Listen for OS theme changes when using system theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentTheme === 'system') {
    applyTheme('system');
    listeners.forEach((fn) => fn());
  }
});

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
