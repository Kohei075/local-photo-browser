import { useEffect } from 'react';

interface KeyboardNavOptions {
  onPrev?: () => void;
  onNext?: () => void;
  onEscape?: () => void;
}

export function useKeyboardNav(options: KeyboardNavOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          options.onPrev?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          options.onNext?.();
          break;
        case 'Escape':
          options.onEscape?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options]);
}
