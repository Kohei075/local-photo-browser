interface NavigationControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onRandom: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function NavigationControls({ onPrev, onNext, onRandom, hasPrev, hasNext }: NavigationControlsProps) {
  return (
    <div className="navigation-controls">
      <button
        className="nav-btn nav-prev"
        onClick={onPrev}
        disabled={!hasPrev}
        title="Previous (Left Arrow)"
      >
        &#8249;
      </button>
      <button
        className="nav-btn nav-random"
        onClick={onRandom}
        title="Random Photo"
      >
        &#8645;
      </button>
      <button
        className="nav-btn nav-next"
        onClick={onNext}
        disabled={!hasNext}
        title="Next (Right Arrow)"
      >
        &#8250;
      </button>
    </div>
  );
}
