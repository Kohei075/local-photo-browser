import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { usePhotos } from '../../hooks/usePhotos';
import { PhotoCard } from './PhotoCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function PhotoGrid() {
  const { photos, page, totalPages, isLoadingPhotos } = useAppStore();
  const { fetchPhotos, loadMore } = usePhotos();
  const observerRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  const { sortBy, sortOrder, favoriteOnly, personTagId } = useAppStore();

  useEffect(() => {
    initialFetchDone.current = false;
  }, [sortBy, sortOrder, favoriteOnly, personTagId]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchPhotos(1);
    }
  }, [fetchPhotos, sortBy, sortOrder, favoriteOnly, personTagId]);

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

  if (photos.length === 0 && isLoadingPhotos) {
    return <LoadingSpinner message="Loading photos..." />;
  }

  if (photos.length === 0 && !isLoadingPhotos) {
    return (
      <div className="empty-state">
        <p>No photos found. Go to Settings to set your photo folder and run a scan.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="photo-grid">
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
