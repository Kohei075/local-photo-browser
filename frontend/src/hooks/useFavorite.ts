import { useCallback } from 'react';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import type { Photo } from '../types';

export function useFavorite() {
  const { updatePhoto } = useAppStore();

  const toggleFavorite = useCallback(async (photo: Photo) => {
    const updated = await api.put<Photo>(`/photos/${photo.id}/favorite`, {
      is_favorite: !photo.is_favorite,
    });
    updatePhoto(updated);
    return updated;
  }, [updatePhoto]);

  return { toggleFavorite };
}
