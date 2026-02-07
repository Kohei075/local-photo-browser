import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import type { Photo } from '../types';

export function useSlideshow(onNextPhoto: (photo: Photo) => void) {
  const {
    isSlideshowPlaying, slideshowInterval,
    setSlideshowPlaying, favoriteOnly, personTagId,
  } = useAppStore();
  const intervalRef = useRef<number | null>(null);

  const fetchRandom = useCallback(async () => {
    const params = new URLSearchParams({
      favorite_only: String(favoriteOnly),
    });
    if (personTagId !== null) {
      params.set('person_tag_id', String(personTagId));
    }
    try {
      const photo = await api.get<Photo>(`/photos/random?${params}`);
      onNextPhoto(photo);
    } catch {
      setSlideshowPlaying(false);
    }
  }, [favoriteOnly, personTagId, onNextPhoto, setSlideshowPlaying]);

  useEffect(() => {
    if (isSlideshowPlaying) {
      intervalRef.current = window.setInterval(fetchRandom, slideshowInterval * 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSlideshowPlaying, slideshowInterval, fetchRandom]);

  const toggle = useCallback(() => {
    setSlideshowPlaying(!isSlideshowPlaying);
  }, [isSlideshowPlaying, setSlideshowPlaying]);

  return { toggle, isPlaying: isSlideshowPlaying };
}
