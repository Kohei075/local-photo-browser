import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Photo } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';

interface RandomPicksPanelProps {
  photos: Photo[];
  onSelect: (id: number) => void;
  onClose: () => void;
  onShuffle: () => void;
}

export interface RandomPicksPanelHandle {
  toggleFullscreen: () => void;
}

export const RandomPicksPanel = forwardRef<RandomPicksPanelHandle, RandomPicksPanelProps>(function RandomPicksPanel({ photos: initialPhotos, onSelect, onClose, onShuffle }, ref) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [photos, setPhotos] = useState(initialPhotos);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  // Sync when parent photos change (e.g. shuffle)
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const toggleFullscreen = useCallback(async () => {
    if (!panelRef.current) return;
    if (!document.fullscreenElement) {
      await panelRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useImperativeHandle(ref, () => ({ toggleFullscreen }), [toggleFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent drag image to use our custom styling instead
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  if (photos.length === 0) return null;

  return (
    <div className="random-picks-panel" ref={panelRef}>
      <div className="random-picks-header">
        <button
          className={`random-picks-layout-btn${layout === 'vertical' ? ' active' : ''}`}
          onClick={() => setLayout('vertical')}
          title={t('viewer.layoutVertical')}
        >
          &#9776;
        </button>
        <button
          className={`random-picks-layout-btn${layout === 'horizontal' ? ' active' : ''}`}
          onClick={() => setLayout('horizontal')}
          title={t('viewer.layoutHorizontal')}
        >
          &#9783;
        </button>
        <button
          className="random-picks-fullscreen-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
        >
          {isFullscreen ? '\u2716' : '\u26F6'}
        </button>
        <button className="random-picks-close" onClick={onClose} title="Close">
          &times;
        </button>
      </div>
      <div className={`random-picks-grid random-picks-grid-${layout}`}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={
              'random-picks-item'
              + (dragIndex === index ? ' dragging' : '')
              + (overIndex === index && dragIndex !== index ? ' drag-over' : '')
            }
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(photo.id)}
          >
            <img
              src={`/api/images/${photo.id}/full?v=${photo.modified_at}`}
              alt={photo.file_name}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
