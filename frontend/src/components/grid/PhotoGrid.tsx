import { useShallow } from 'zustand/react/shallow';
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { usePhotos } from '../../hooks/usePhotos';
import { PhotoCard } from './PhotoCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useTranslation } from '../../i18n/useTranslation';

export function PhotoGrid() {
  const { photos, page, totalPages, isLoadingPhotos } = useAppStore(useShallow((state) => ({
    photos: state.photos,
    page: state.page,
    totalPages: state.totalPages,
    isLoadingPhotos: state.isLoadingPhotos,
  })));
  const { fetchPhotos, loadMore } = usePhotos();
  const observerRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  const { sortBy, sortOrder, selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo, randomKey, gridColumns } = useAppStore(useShallow((state) => ({
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    selectedFolderPath: state.selectedFolderPath,
    includeSubfolders: state.includeSubfolders,
    mediaFilter: state.mediaFilter,
    dateField: state.dateField,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    randomKey: state.randomKey,
    gridColumns: state.gridColumns,
  })));
  const { t } = useTranslation();

  useEffect(() => {
    initialFetchDone.current = false;
  }, [sortBy, sortOrder, selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo, randomKey]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      // If photos already exist in the store (e.g. navigating back), skip re-fetch
      if (photos.length > 0) {
        initialFetchDone.current = true;
        return;
      }
      initialFetchDone.current = true;
      fetchPhotos(1);
    }
  }, [fetchPhotos, sortBy, sortOrder, selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo, randomKey, photos.length]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && page < totalPages && !isLoadingPhotos) {
        loadMore();
      }
    },
    [page, totalPages, isLoadingPhotos, loadMore]
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Restore scroll position to last viewed photo when returning from viewer
  useEffect(() => {
    const id = useAppStore.getState().lastViewedPhotoId;
    if (id == null || photos.length === 0) return;
    if (!photos.some((p) => p.id === id)) return;
    const el = document.querySelector(`[data-photo-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
      useAppStore.getState().setLastViewedPhotoId(null);
    }
  }, [photos]);

  if (photos.length === 0 && isLoadingPhotos) {
    return <LoadingSpinner message={t('grid.loading')} />;
  }

  if (photos.length === 0 && !isLoadingPhotos) {
    return (
      <div className="empty-state">
        <p>{t('grid.empty')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="photo-grid" style={{ '--grid-columns': gridColumns } as React.CSSProperties}>
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
      <div ref={observerRef} className="scroll-sentinel">
        {isLoadingPhotos && <LoadingSpinner />}
      </div>
    </div>
  );
}
