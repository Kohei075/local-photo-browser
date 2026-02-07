import { useEffect } from 'react';

interface KeyboardNavOptions {
  onPrev?: () => void;
  onNext?: () => void;
  onToggleSlideshow?: () => void;
  onToggleFavorite?: () => void;
  onEscape?: () => void;
}

export function useKeyboardNav(options: KeyboardNavOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
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
        case ' ':
          e.preventDefault();
          options.onToggleSlideshow?.();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          options.onToggleFavorite?.();
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
