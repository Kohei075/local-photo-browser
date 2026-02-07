interface SlideshowControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function SlideshowControls({ isPlaying, onToggle }: SlideshowControlsProps) {
  return (
    <button
      className={`slideshow-btn ${isPlaying ? 'playing' : ''}`}
      onClick={onToggle}
      title={isPlaying ? 'Stop Slideshow (Space)' : 'Start Slideshow (Space)'}
    >
      {isPlaying ? '⏸' : '▶'}
    </button>
  );
}
