import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import { useFavorite } from '../hooks/useFavorite';
import { useSlideshow } from '../hooks/useSlideshow';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { PhotoViewer } from '../components/viewer/PhotoViewer';
import { NavigationControls } from '../components/viewer/NavigationControls';
import { SlideshowControls } from '../components/viewer/SlideshowControls';
import { FavoriteButton } from '../components/viewer/FavoriteButton';
import { TagManager } from '../components/viewer/TagManager';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Photo, NeighborsResponse } from '../types';

export function ViewerPage() {
  const { photoId } = useParams<{ photoId: string }>();
  const navigate = useNavigate();
  const { sortBy, sortOrder, favoriteOnly, personTagId } = useAppStore();
  const { toggleFavorite } = useFavorite();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborsResponse>({ prev_id: null, next_id: null });
  const [loading, setLoading] = useState(true);

  const fetchPhoto = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [photoData, neighborsData] = await Promise.all([
        api.get<Photo>(`/photos/${id}`),
        api.get<NeighborsResponse>(
          `/photos/${id}/neighbors?sort_by=${sortBy}&sort_order=${sortOrder}&favorite_only=${favoriteOnly}${personTagId !== null ? `&person_tag_id=${personTagId}` : ''}`
        ),
      ]);
      setPhoto(photoData);
      setNeighbors(neighborsData);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, favoriteOnly, personTagId, navigate]);

  useEffect(() => {
    if (photoId) fetchPhoto(photoId);
  }, [photoId, fetchPhoto]);

  const goTo = useCallback((id: number | null) => {
    if (id !== null) navigate(`/viewer/${id}`);
  }, [navigate]);

  const handleRandom = useCallback(async () => {
    const params = new URLSearchParams({
      favorite_only: String(favoriteOnly),
    });
    if (personTagId !== null) params.set('person_tag_id', String(personTagId));
    try {
      const randomPhoto = await api.get<Photo>(`/photos/random?${params}`);
      navigate(`/viewer/${randomPhoto.id}`);
    } catch { /* no photos */ }
  }, [favoriteOnly, personTagId, navigate]);

  const handleSlideshowNext = useCallback((nextPhoto: Photo) => {
    navigate(`/viewer/${nextPhoto.id}`);
  }, [navigate]);

  const { toggle: toggleSlideshow, isPlaying } = useSlideshow(handleSlideshowNext);

  const handleToggleFavorite = useCallback(async () => {
    if (photo) {
      const updated = await toggleFavorite(photo);
      setPhoto(updated);
    }
  }, [photo, toggleFavorite]);

  useKeyboardNav({
    onPrev: () => goTo(neighbors.prev_id),
    onNext: () => goTo(neighbors.next_id),
    onToggleSlideshow: toggleSlideshow,
    onToggleFavorite: handleToggleFavorite,
    onEscape: () => navigate('/'),
  });

  if (loading || !photo) return <LoadingSpinner message="Loading photo..." />;

  return (
    <div className="viewer-page">
      <div className="viewer-top-bar">
        <button className="btn" onClick={() => navigate('/')}>
          &#8592; Gallery
        </button>
        <span className="viewer-filename">{photo.file_name}</span>
        <div className="viewer-top-actions">
          <FavoriteButton photo={photo} onToggle={handleToggleFavorite} />
          <SlideshowControls isPlaying={isPlaying} onToggle={toggleSlideshow} />
        </div>
      </div>

      <PhotoViewer photo={photo} />

      <NavigationControls
        onPrev={() => goTo(neighbors.prev_id)}
        onNext={() => goTo(neighbors.next_id)}
        onRandom={handleRandom}
        hasPrev={neighbors.prev_id !== null}
        hasNext={neighbors.next_id !== null}
      />

      <div className="viewer-bottom-bar">
        <TagManager photo={photo} onUpdate={() => { if (photoId) fetchPhoto(photoId); }} />
        <div className="viewer-info">
          {photo.width && photo.height && <span>{photo.width}x{photo.height}</span>}
          <span>{(photo.file_size / 1024 / 1024).toFixed(1)} MB</span>
          {photo.taken_at && <span>Taken: {new Date(photo.taken_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}
