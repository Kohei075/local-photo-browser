import { useCallback } from 'react';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import type { PersonTag } from '../types';

export function useTags() {
  const { setPersonTags } = useAppStore();

  const fetchTags = useCallback(async () => {
    const tags = await api.get<PersonTag[]>('/tags');
    setPersonTags(tags);
  }, [setPersonTags]);

  const createTag = useCallback(async (name: string) => {
    await api.post('/tags', { name });
    await fetchTags();
  }, [fetchTags]);

  const updateTag = useCallback(async (id: number, name: string) => {
    await api.put(`/tags/${id}`, { name });
    await fetchTags();
  }, [fetchTags]);

  const deleteTag = useCallback(async (id: number) => {
    await api.delete(`/tags/${id}`);
    await fetchTags();
  }, [fetchTags]);

  const addTagToPhoto = useCallback(async (photoId: number, personTagId: number) => {
    await api.post(`/photos/${photoId}/tags`, { person_tag_id: personTagId });
  }, []);

  const removeTagFromPhoto = useCallback(async (photoId: number, tagId: number) => {
    await api.delete(`/photos/${photoId}/tags/${tagId}`);
  }, []);

  return { fetchTags, createTag, updateTag, deleteTag, addTagToPhoto, removeTagFromPhoto };
}
