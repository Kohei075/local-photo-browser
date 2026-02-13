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

export const RandomPicksPanel = forwardRef<RandomPicksPanelHandle, RandomPicksPanelProps>(function RandomPicksPanel({ photos, onSelect, onClose, onShuffle }, ref) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const { t } = useTranslation();

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
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="random-picks-item"
            onClick={() => onSelect(photo.id)}
          >
            <img
              src={`/api/images/${photo.id}/full`}
              alt={photo.file_name}
              draggable={false}
            />
          </div>
        ))}
      </div>
      <div className="navigation-controls">
        <button className="nav-btn" onClick={onShuffle} title="Previous (Left Arrow)">
          &#8249;
        </button>
        <button className="nav-btn nav-random" onClick={onShuffle} title="Shuffle">
          &#8645;
        </button>
        <button className="nav-btn" onClick={onShuffle} title="Next (Right Arrow)">
          &#8250;
        </button>
      </div>
    </div>
  );
});
