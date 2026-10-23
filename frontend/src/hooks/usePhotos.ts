import { useShallow } from 'zustand/react/shallow';
import { useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import { appendPhotoFilters } from '../utils/photoParams';
import type { PhotoListResponse } from '../types';

export function usePhotos() {
  const {
    page, perPage, sortBy, sortOrder, selectedFolderPath, includeSubfolders, mediaFilter,
    dateField, dateFrom, dateTo,
    isLoadingPhotos, setPhotos, appendPhotos, setLoadingPhotos,
  } = useAppStore(useShallow((state) => ({
    page: state.page,
    perPage: state.perPage,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    selectedFolderPath: state.selectedFolderPath,
    includeSubfolders: state.includeSubfolders,
    mediaFilter: state.mediaFilter,
    dateField: state.dateField,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    isLoadingPhotos: state.isLoadingPhotos,
    setPhotos: state.setPhotos,
    appendPhotos: state.appendPhotos,
    setLoadingPhotos: state.setLoadingPhotos,
  })));

  // Discard responses of requests that a newer one has already superseded
  // (e.g. picking the start and end date of the range in quick succession).
  const requestIdRef = useRef(0);

  const fetchPhotos = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    const requestId = ++requestIdRef.current;
    const refreshKey = useAppStore.getState().randomKey;
    setLoadingPhotos(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        per_page: String(perPage),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      appendPhotoFilters(params, { selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo });
      const data = await api.get<PhotoListResponse>(`/photos?${params}`, { deduplicate: sortBy !== 'random' });
      if (requestId !== requestIdRef.current || refreshKey !== useAppStore.getState().randomKey) return;
      if (append) {
        appendPhotos(data.items, data.total, data.page, data.total_pages);
      } else {
        setPhotos(data.items, data.total, data.page, data.per_page, data.total_pages);
      }
    } finally {
      if (requestId === requestIdRef.current) setLoadingPhotos(false);
    }
  }, [perPage, sortBy, sortOrder, selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo, setPhotos, appendPhotos, setLoadingPhotos]);

  const loadMore = useCallback(() => {
    if (!isLoadingPhotos) {
      fetchPhotos(page + 1, true);
    }
  }, [fetchPhotos, page, isLoadingPhotos]);

  return { fetchPhotos, loadMore };
}
