import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Photo } from '../../types';
import { ZoomControls } from './ZoomControls';
import { ScreenshotButton } from './ScreenshotButton';
import { useTranslation } from '../../i18n/useTranslation';
import { useScreenshot } from '../../hooks/useScreenshot';
import { isVideo } from '../../utils/media';

interface PhotoViewerProps {
  photo: Photo;
}

export interface PhotoViewerHandle {
  toggleFullscreen: () => void;
}

export const PhotoViewer = forwardRef<PhotoViewerHandle, PhotoViewerProps>(function PhotoViewer({ photo }, ref) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { capture, capturing } = useScreenshot();
  const video = isVideo(photo.extension);

  // Step factors: buttons jump in larger increments, the wheel is finer-grained.
  const BUTTON_ZOOM_STEP = 1.3;
  const WHEEL_ZOOM_STEP = 1.08;

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => Math.min(s * factor, 5));
  }, []);

  const zoomOutBy = useCallback((factor: number) => {
    setScale((s) => {
      const newScale = s / factor;
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return newScale;
    });
  }, []);

  const handleZoomIn = useCallback(() => zoomBy(BUTTON_ZOOM_STEP), [zoomBy]);
  const handleZoomOut = useCallback(() => zoomOutBy(BUTTON_ZOOM_STEP), [zoomOutBy]);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Use native event listener with { passive: false } to allow preventDefault()
  useEffect(() => {
    if (video) return;
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomBy(WHEEL_ZOOM_STEP);
      else zoomOutBy(WHEEL_ZOOM_STEP);
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [zoomBy, zoomOutBy, video]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      await viewerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useImperativeHandle(ref, () => ({ toggleFullscreen }), [toggleFullscreen]);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Reset zoom when photo changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photo.id]);

  return (
    <div className="photo-viewer" ref={viewerRef}>
      <div
        className="photo-viewer-container"
        ref={containerRef}

        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: !video && scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {video ? (
          <video
            key={photo.id}
            className="photo-viewer-video"
            src={`/api/images/${photo.id}/full?v=${photo.modified_at}`}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={`/api/images/${photo.id}/full?v=${photo.modified_at}`}
            alt={photo.file_name}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s',
            }}
            draggable={false}
          />
        )}
      </div>
      {isFullscreen && <ScreenshotButton className="screenshot-btn" onClick={() => capture(viewerRef.current)} disabled={capturing} />}
      <button
        className="fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
      >
        {isFullscreen ? '\u2716' : '\u26F6'}
      </button>
      {!video && (
        <ZoomControls
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      )}
    </div>
  );
});
